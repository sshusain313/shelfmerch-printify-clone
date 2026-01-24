import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Stage, Layer, Text, TextPath, Image, Rect, Group, Transformer, Line, Shape, Circle, RegularPolygon, Star } from 'react-konva';
import Konva from 'konva';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Upload, Type, Image as ImageIcon, Folder, Sparkles, Undo2, Redo2,
  ZoomIn, ZoomOut, Move, Copy, Trash2, X, Save, Layers, Eye, EyeOff,
  Lock, Unlock, AlignLeft, AlignCenter, AlignRight, Bold, Italic,
  Underline, Palette, Grid, Ruler, Download, Settings, ChevronRight,
  ChevronLeft, Maximize2, Minimize2, RotateCw, Square, Circle as CircleIcon, Triangle, Sparkles as SparklesIcon, Wand2,
  Heart, Star as StarIcon, ArrowRight, Search, Filter, SortAsc, FolderOpen, ArrowLeft, ArrowUp, ArrowDown, Pen, Camera, Layout
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { productApi, storeApi, storeProductsApi } from '@/lib/api';
import TextPanel from '@/components/designer/TextPanel';
import { ProductInfoPanel } from '@/components/designer/ProductsInfoPanel';
import { RealisticWebGLPreview } from '@/components/admin/RealisticWebGLPreview';
import { UploadPanel } from '@/components/designer/UploadPanel';
import { DisplacementSettingsPanel } from '@/components/designer/DisplacementSettingsPanel';
import type { DisplacementSettings } from '@/types/product';
import { API_BASE_URL, RAW_API_URL } from '@/config';

// Types
interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'group';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  visible?: boolean;
  locked?: boolean;
  zIndex: number;
  view?: string; // Store which view this element belongs to (e.g., 'front', 'back')
  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontStyle?: string;
  align?: string;
  letterSpacing?: number;
  curved?: boolean;
  curveRadius?: number;
  curveShape?: 'arch-down' | 'arch-up' | 'circle';
  // Image specific
  imageUrl?: string;
  placeholderId?: string; // Store which placeholder this image belongs to
  // Shape specific
  shapeType?: 'rect' | 'circle' | 'triangle' | 'star' | 'heart' | 'line' | 'arrow';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  // Advanced image properties
  flipX?: boolean;
  flipY?: boolean;
  scaleX?: number;
  scaleY?: number;
  lockAspectRatio?: boolean;
  skewX?: number; // Warping/distortion -180 to 180
  skewY?: number; // Warping/distortion -180 to 180
  // Filters
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
  hue?: number; // 0 to 360
  blur?: number; // 0 to 20
  // Shadow
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowColor?: string;
  shadowOpacity?: number;
  // Border
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed';
  // Blend mode
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';
}

interface HistoryState {
  elements: CanvasElement[];
  timestamp: number;
}

interface Placeholder {
  id: string;
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
  rotationDeg?: number;
  scale?: number;
  lockSize?: boolean;
  dpi?: number;
  // For polygon/magnetic lasso placeholders
  polygonPoints?: Array<{ xIn: number; yIn: number }>;
  shapeType?: 'rect' | 'polygon';
}

interface ProductView {
  key: string;
  mockupImageUrl: string;
  placeholders: Placeholder[];
}

interface Product {
  _id?: string;
  id?: string;
  catalogue?: {
    name?: string;
    description?: string;
    basePrice?: number;
  };

  design?: {
    views?: ProductView[];
    dpi?: number;
    physicalDimensions?: {
      width?: number;  // in inches
      height?: number; // in inches
      length?: number; // in inches
    };
    displacementSettings?: DisplacementSettings;
  };
  galleryImages?: Array<{ url: string; isPrimary?: boolean }>;
  availableColors?: string[];
  availableSizes?: string[];
}

const DesignEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Canvas state
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const webglCanvasRef = useRef<HTMLDivElement | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(100);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageSize, setStageSize] = useState({ width: 800, height: 1000 });

  // Tool state
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'upload' | 'graphics' | 'patterns' | 'logos' | 'ai' | 'library' | 'shapes' | 'templates'>('select');
  const [textInput, setTextInput] = useState('');
  const [selectedFont, setSelectedFont] = useState('Arial');
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState('#000000');
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string[]>([]);
  const [selectedPlaceholderId, setSelectedPlaceholderId] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<string>('product');

  // Use ref to track selected placeholder for callback
  const selectedPlaceholderIdRef = useRef<string | null>(null);

  // Update ref when state changes
  useEffect(() => {
    selectedPlaceholderIdRef.current = selectedPlaceholderId;
    console.log('selectedPlaceholderId updated:', selectedPlaceholderId);
  }, [selectedPlaceholderId]);

  // History
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistory = 50;

  // View state
  const [currentView, setCurrentView] = useState<'front' | 'back' | 'sleeves'>('front');
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [previewMode, setPreviewMode] = useState(false); // true = hide overlay/panels, show only WebGL mockup
  const [primaryColorHex, setPrimaryColorHex] = useState<string | null>(null);
  const previewModeRef = useRef(false); // Ref to ensure previewMode persists across view changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Track if there are unsaved changes

  // Sync ref with state
  useEffect(() => {
    previewModeRef.current = previewMode;
  }, [previewMode]);

  const fetchUserPreviews = useCallback(async () => {
    try {
      if (!id) return;
      const token = localStorage.getItem('token');
      const resp = await fetch(`${RAW_API_URL}/api/auth/me/previews/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });
      const json = await resp.json().catch(() => ({}));
      if (resp.ok && json?.success) {
        const previews = (json.data || {}) as Record<string, string>;
        setSavedPreviewImages(previews);
      }
    } catch (e) {
      console.error('Failed to fetch user preview images:', e);
    }
  }, [id]);

  // Design URLs by placeholder ID for WebGL preview - stored per view
  const [designUrlsByPlaceholder, setDesignUrlsByPlaceholder] = useState<Record<string, Record<string, string>>>({});

  // Helper functions for view-specific designUrlsByPlaceholder
  const getDesignUrlsForView = useCallback((view: string): Record<string, string> => {
    return designUrlsByPlaceholder[view] || {};
  }, [designUrlsByPlaceholder]);

  // Helper to create a simple hash of design URLs for key generation
  const getDesignUrlsHash = useCallback((view: string): string => {
    const urls = getDesignUrlsForView(view);
    const keys = Object.keys(urls).sort();
    if (keys.length === 0) return 'no-designs';
    // Create a simple hash from placeholder IDs and URL lengths
    return keys.map(k => `${k.slice(0, 4)}-${urls[k]?.slice(-10) || ''}`).join('_');
  }, [getDesignUrlsForView]);

  const setDesignUrlForView = useCallback((view: string, placeholderId: string, designUrl: string) => {
    setDesignUrlsByPlaceholder(prev => ({
      ...prev,
      [view]: {
        ...(prev[view] || {}),
        [placeholderId]: designUrl,
      },
    }));
    setHasUnsavedChanges(true); // Mark as having unsaved changes
    // Mark this specific view as dirty for design changes
    setDirtyViewsForDesign(prev => new Set([...prev, view]));
    console.log('Design changed for view, marking dirty:', view);
  }, []);

  const removeDesignUrlForView = useCallback((view: string, placeholderId: string) => {
    setDesignUrlsByPlaceholder(prev => {
      const viewDesigns = prev[view] || {};
      const updated = { ...viewDesigns };
      delete updated[placeholderId];
      return {
        ...prev,
        [view]: updated,
      };
    });
    setHasUnsavedChanges(true); // Mark as having unsaved changes
  }, []);

  // Product state
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  // Store mockup images per view to prevent losing previous mockups when switching
  const [mockupImagesByView, setMockupImagesByView] = useState<Record<string, HTMLImageElement | null>>({});
  const [imageSizesByView, setImageSizesByView] = useState<Record<string, { width: number; height: number; x: number; y: number }>>({});

  // Current view's mockup (derived from mockupImagesByView)
  const mockupImage = mockupImagesByView[currentView] || null;
  const imageSize = imageSizesByView[currentView] || { width: 0, height: 0, x: 0, y: 0 };
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]); // Keep for backward compatibility
  const [selectedSizesByColor, setSelectedSizesByColor] = useState<Record<string, string[]>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [displacementSettings, setDisplacementSettings] = useState<DisplacementSettings>({
    scaleX: 20,
    scaleY: 20,
    contrastBoost: 1.5,
  });
  const [savedPreviewImages, setSavedPreviewImages] = useState<Record<string, string>>({});

  // Preview cache with proper keying: viewKey|garmentTintHex|designSig|settingsSig
  const [previewCache, setPreviewCache] = useState<Record<string, string>>({});

  // Dirty flags: track which views need regeneration
  const [dirtyViewsForColor, setDirtyViewsForColor] = useState<Set<string>>(new Set());
  const [dirtyViewsForDesign, setDirtyViewsForDesign] = useState<Set<string>>(new Set());

  // Generate cache key: viewKey|garmentTintHex|designSig|settingsSig
  const getPreviewCacheKey = useCallback((viewKey: string): string => {
    const colorKey = primaryColorHex || 'no-color';
    const designSig = getDesignUrlsHash(viewKey);
    // Include canvas elements in design signature - match WebGL filtering logic exactly
    // Elements without view property appear on all views, so include them for all views
    const viewElements = elements.filter(el =>
      el.view === viewKey || (!el.view) // Match WebGL: el.view === currentView || !el.view
    );
    const elementsSig = viewElements.length > 0
      ? viewElements.map(el => `${el.id}-${el.type}-${el.imageUrl?.slice(-10) || ''}`).join('|')
      : 'no-elements';
    const combinedDesignSig = `${designSig}|${elementsSig}`;
    const settingsSig = `${displacementSettings.scaleX}|${displacementSettings.scaleY}|${displacementSettings.contrastBoost}`;
    return `${viewKey}|${colorKey}|${combinedDesignSig}|${settingsSig}`;
  }, [primaryColorHex, getDesignUrlsHash, elements, displacementSettings]);

  // Wrapper for displacement settings that marks unsaved changes
  const handleDisplacementSettingsChange = useCallback((settings: DisplacementSettings) => {
    setDisplacementSettings(settings);
    setHasUnsavedChanges(true); // Mark as having unsaved changes
    // Mark current view as dirty for design changes (settings affect preview)
    setDirtyViewsForDesign(prev => new Set([...prev, currentView]));
  }, [currentView]);

  // Handle global color change - mark ALL views dirty
  useEffect(() => {
    if (product?.design?.views) {
      const allViewKeys = product.design.views.map((v: ProductView) => v.key);
      setDirtyViewsForColor(new Set(allViewKeys));
      console.log('[DesignEditor] Global color changed:', {
        primaryColorHex,
        currentView,
        allViewKeys,
        elementsCount: elements.length,
        elementsByView: {
          front: elements.filter(e => e.view === 'front' || !e.view).length,
          back: elements.filter(e => e.view === 'back').length,
        },
        designUrlsByPlaceholder: Object.keys(designUrlsByPlaceholder).reduce((acc, view) => {
          acc[view] = Object.keys(designUrlsByPlaceholder[view] || {}).length;
          return acc;
        }, {} as Record<string, number>),
      });
    }
  }, [primaryColorHex, product?.design?.views]);


  const tools = [
    {
      icon: Upload,
      label: 'Upload',
      toolKey: 'upload',
      onClick: () => {
        setActiveTool('upload');
        setShowLeftPanel(true);
      }
    },
    {
      icon: Type,
      label: 'Text',
      toolKey: 'text',
      onClick: () => {
        setActiveTool('text');
        setShowLeftPanel(true);
      }
    },
    {
      icon: Sparkles,
      label: 'Shapes',
      toolKey: 'shapes',
      onClick: () => {
        setActiveTool('shapes');
        setShowLeftPanel(true);
      }
    },
    {
      icon: Palette,
      label: 'Graphics',
      toolKey: 'graphics',
      onClick: () => {
        setActiveTool('graphics');
        setShowLeftPanel(true);
      }
    },
    {
      icon: Wand2,
      label: 'Patterns',
      toolKey: 'patterns',
      onClick: () => {
        setActiveTool('patterns');
        setShowLeftPanel(true);
      }
    },
    {
      icon: ImageIcon,
      label: 'Logos',
      toolKey: 'logos',
      onClick: () => {
        setActiveTool('logos');
        setShowLeftPanel(true);
      }
    },
    {
      icon: Folder,
      label: 'Library',
      toolKey: 'library',
      onClick: () => {
        setActiveTool('library');
        setShowLeftPanel(true);
      }
    },
    {
      icon: Layout,
      label: 'Templates',
      toolKey: 'templates',
      onClick: () => {
        setActiveTool('templates');
        setShowLeftPanel(true);
      }
    }
  ];

  // Canvas dimensions - fixed size like admin
  const canvasWidth = 800;
  const canvasHeight = 600;
  const canvasPadding = 40;
  const effectiveCanvasWidth = canvasWidth - (canvasPadding * 2);
  const effectiveCanvasHeight = canvasHeight - (canvasPadding * 2);

  // Ensure Stage is sized immediately so Konva placeholder outlines appear instantly
  useEffect(() => {
    setStageSize({ width: canvasWidth, height: canvasHeight });
  }, [canvasWidth, canvasHeight]);

  // Function to load mockup for a specific view
  const loadMockupForView = useCallback((viewKey: string, views: ProductView[]) => {
    const view = views.find((v: ProductView) => v.key === viewKey);

    if (view?.mockupImageUrl) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Store mockup image per view
        setMockupImagesByView(prev => ({
          ...prev,
          [viewKey]: img
        }));

        // Calculate size to fit canvas while maintaining aspect ratio with padding
        const aspectRatio = img.width / img.height;
        const maxWidth = effectiveCanvasWidth;
        const maxHeight = effectiveCanvasHeight;

        let width = maxWidth;
        let height = maxWidth / aspectRatio;

        // If height exceeds, fit to height instead
        if (height > maxHeight) {
          height = maxHeight;
          width = maxHeight * aspectRatio;
        }

        // Center the image
        const x = canvasPadding + (maxWidth - width) / 2;
        const y = canvasPadding + (maxHeight - height) / 2;

        const calculatedSize = { width, height, x, y };
        // Store image size per view
        setImageSizesByView(prev => ({
          ...prev,
          [viewKey]: calculatedSize
        }));
        setStageSize({ width: canvasWidth, height: canvasHeight });

        console.log(`Mockup image loaded for ${viewKey} view:`, {
          original: { width: img.width, height: img.height },
          displayed: calculatedSize,
          canvas: { width: canvasWidth, height: canvasHeight }
        });
      };
      img.onerror = () => {
        toast.error(`Failed to load mockup image for ${viewKey} view`);
        console.error(`Failed to load mockup for ${viewKey} view`);
        // Store null to prevent retrying
        setMockupImagesByView(prev => ({
          ...prev,
          [viewKey]: null
        }));
        setImageSizesByView(prev => ({
          ...prev,
          [viewKey]: { width: 0, height: 0, x: 0, y: 0 }
        }));
      };
      img.src = view.mockupImageUrl;
    } else {
      // No mockup available for this view
      console.warn(`No mockup image found for ${viewKey} view`);
      setMockupImagesByView(prev => ({
        ...prev,
        [viewKey]: null
      }));
      setImageSizesByView(prev => ({
        ...prev,
        [viewKey]: { width: 0, height: 0, x: 0, y: 0 }
      }));
    }
  }, [effectiveCanvasWidth, effectiveCanvasHeight, canvasPadding, canvasWidth, canvasHeight]);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setIsLoadingProduct(false);
        return;
      }

      try {
        setIsLoadingProduct(true);
        const response = await productApi.getById(id);
        if (response && response.data) {
          console.log('Fetched product data:', {
            product: response.data,
            design: response.data.design,
            views: response.data.design?.views,
            physicalDimensions: response.data.design?.physicalDimensions
          });

          setProduct(response.data);
          const previews = (response.data.design as any)?.previewImages || {};
          if (previews && typeof previews === 'object') {
            setSavedPreviewImages(previews);
          }

          // Load mockup image for current view
          if (response.data.design?.views) {
            loadMockupForView(currentView, response.data.design.views);
          }

          // Initialize displacement settings from product design (if present)
          if (response.data.design?.displacementSettings) {
            setDisplacementSettings(response.data.design.displacementSettings);
          }

          // Reset unsaved changes flag when product is loaded (no changes yet)
          setHasUnsavedChanges(false);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error('Failed to load product data');
      } finally {
        setIsLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [id, canvasWidth, canvasHeight, effectiveCanvasWidth, effectiveCanvasHeight, canvasPadding, loadMockupForView]);

  // Restore design state from sessionStorage after product loads
  useEffect(() => {
    if (!id || !product) return;

    try {
      const savedState = sessionStorage.getItem(`designer_state_${id}`);
      if (savedState) {
        const designState = JSON.parse(savedState);
        if (designState.elements && Array.isArray(designState.elements)) {
          setElements(designState.elements);
        }
        if (designState.selectedColors && Array.isArray(designState.selectedColors)) {
          setSelectedColors(designState.selectedColors);
        }
        if (designState.selectedSizes && Array.isArray(designState.selectedSizes)) {
          setSelectedSizes(designState.selectedSizes);
        }
        if (designState.selectedSizesByColor && typeof designState.selectedSizesByColor === 'object') {
          setSelectedSizesByColor(designState.selectedSizesByColor);
        }
        if (designState.currentView && ['front', 'back', 'sleeves'].includes(designState.currentView)) {
          setCurrentView(designState.currentView);
        }
        if (designState.designUrlsByPlaceholder && typeof designState.designUrlsByPlaceholder === 'object') {
          setDesignUrlsByPlaceholder(designState.designUrlsByPlaceholder);
        }
        // Clear the saved state after restoring
        sessionStorage.removeItem(`designer_state_${id}`);
      }
    } catch (err) {
      console.error('Failed to restore design state:', err);
    }
  }, [id, product]);

  // Load mockup when view changes (if not already loaded)
  useEffect(() => {
    if (product?.design?.views) {
      // Only load if not already loaded for this view
      const existingMockup = mockupImagesByView[currentView];
      if (!existingMockup) {
        console.log(`Loading mockup for view: ${currentView}`);
        loadMockupForView(currentView, product.design.views);
      } else {
        console.log(`Using existing mockup for view: ${currentView}`);
        // Update stage size when switching to a view that already has a mockup
        const size = imageSizesByView[currentView];
        if (size && size.width > 0) {
          setStageSize({ width: canvasWidth, height: canvasHeight });
        }
      }
    }
  }, [currentView, product?.design?.views, loadMockupForView, mockupImagesByView, imageSizesByView, canvasWidth, canvasHeight]);

  // Reset selections when product changes
  useEffect(() => {
    setSelectedColors([]);
    setSelectedSizes([]);
  }, [product?._id]);

  // Track if we're currently saving a preview to avoid duplicate saves
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const [storeProductId, setStoreProductId] = useState<string | null>(null);

  // Get current view data
  const currentViewData = useMemo(() => {
    if (!product?.design?.views) return null;
    return product.design.views.find((v: ProductView) => v.key === currentView);
  }, [product, currentView]);

  // Use the same default physical dimensions as the admin ProductImageConfigurator
  const DEFAULT_PHYSICAL_WIDTH = 20;
  const DEFAULT_PHYSICAL_HEIGHT = 24;
  const DEFAULT_PHYSICAL_LENGTH = 18;

  // Calculate PX_PER_INCH based on physical dimensions (matches CanvasMockup.tsx exactly)
  const PX_PER_INCH = useMemo(() => {
    // Prefer persisted physicalDimensions from the product.
    // If they are missing (older products), fall back to the same defaults
    // that the admin ProductImageConfigurator uses so both UIs stay in sync.
    const physicalWidth =
      product?.design?.physicalDimensions?.width ?? DEFAULT_PHYSICAL_WIDTH;
    const physicalHeight =
      product?.design?.physicalDimensions?.height ?? DEFAULT_PHYSICAL_HEIGHT;

    if (!physicalWidth || !physicalHeight || physicalWidth <= 0 || physicalHeight <= 0) {
      console.warn('Could not determine physical dimensions, using hardcoded fallback PX_PER_INCH');
      return 10; // Very last-resort fallback
    }

    const scaleX = effectiveCanvasWidth / physicalWidth;
    const scaleY = effectiveCanvasHeight / physicalHeight;
    const pxPerInch = Math.min(scaleX, scaleY);

    console.log('Calculated PX_PER_INCH (DesignEditor):', {
      physicalWidth,
      physicalHeight,
      effectiveCanvasWidth,
      effectiveCanvasHeight,
      scaleX,
      scaleY,
      pxPerInch
    });

    return pxPerInch;
  }, [product?.design?.physicalDimensions, effectiveCanvasWidth, effectiveCanvasHeight]);

  // Helper function to convert inches to pixels (matches CanvasMockup.tsx)
  const inchesToPixels = useCallback((inches: number): number => {
    return inches * PX_PER_INCH;
  }, [PX_PER_INCH]);

  // Get all placeholders for current view - EXACT LOGIC FROM CanvasMockup.tsx
  const placeholders = useMemo(() => {
    if (!currentViewData?.placeholders || currentViewData.placeholders.length === 0) {
      console.log('No placeholders found for current view');
      return [];
    }

    const converted = currentViewData.placeholders.map((placeholder: Placeholder) => {
      const scale = placeholder.scale ?? 1.0;
      const isPolygon = placeholder.shapeType === 'polygon' && placeholder.polygonPoints && placeholder.polygonPoints.length >= 3;

      // Convert inches to pixels for display, then apply scale
      // ADD canvas padding just like CanvasMockup.tsx
      const xPx = canvasPadding + inchesToPixels(placeholder.xIn);
      const yPx = canvasPadding + inchesToPixels(placeholder.yIn);
      const widthPx = inchesToPixels(placeholder.widthIn) * scale;
      const heightPx = inchesToPixels(placeholder.heightIn) * scale;

      // For polygons, convert polygon points from inches to pixels
      const polygonPointsPx = isPolygon
        ? placeholder.polygonPoints!.map((pt) => [
          canvasPadding + inchesToPixels(pt.xIn) * scale,
          canvasPadding + inchesToPixels(pt.yIn) * scale,
        ]).flat()
        : undefined;

      console.log(`Placeholder ${placeholder.id} conversion (matching CanvasMockup):`, {
        input: {
          xIn: placeholder.xIn,
          yIn: placeholder.yIn,
          widthIn: placeholder.widthIn,
          heightIn: placeholder.heightIn,
          scale,
          isPolygon,
          polygonPointsCount: placeholder.polygonPoints?.length
        },
        calculation: {
          PX_PER_INCH,
          canvasPadding,
          formula: `${canvasPadding} + (${placeholder.xIn} * ${PX_PER_INCH})`
        },
        output: {
          x: xPx,
          y: yPx,
          width: widthPx,
          height: heightPx,
          rotation: placeholder.rotationDeg || 0,
          polygonPointsPx
        }
      });

      return {
        id: placeholder.id,
        x: xPx,
        y: yPx,
        width: widthPx,
        height: heightPx,
        rotation: placeholder.rotationDeg || 0,
        scale,
        lockSize: placeholder.lockSize || false,
        original: placeholder,
        isPolygon,
        polygonPointsPx
      };
    });

    console.log('All placeholders converted:', converted);

    return converted;
  }, [currentViewData, PX_PER_INCH, inchesToPixels, canvasPadding]);

  // Primary print area (first placeholder or default)
  const printArea = useMemo(() => {
    if (placeholders.length > 0) {
      const placeholder = placeholders[0];
      return {
        x: placeholder.x,
        y: placeholder.y,
        width: placeholder.width,
        height: placeholder.height
      };
    }
    // Default print area
    return {
      x: stageSize.width * 0.1,
      y: stageSize.height * 0.15,
      width: stageSize.width * 0.8,
      height: stageSize.height * 0.6
    };
  }, [placeholders, stageSize]);

  // Available views from product
  const availableViews = useMemo(() => {
    if (!product?.design?.views) return [];
    return product.design.views.map((v: ProductView) => v.key);
  }, [product]);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      saveToHistory();
    }, 30000); // Auto-save every 30 seconds
    return () => clearInterval(interval);
  }, [elements]);

  // Attach transformer to selected element
  useEffect(() => {
    if (selectedIds.length === 1 && transformerRef.current && stageRef.current && !previewMode) {
      const stage = stageRef.current;
      const selectedId = selectedIds[0];
      const selectedNode = stage.findOne(`#${selectedId}`);

      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedIds, previewMode, elements]); // Add elements to dependency to update transformer when text changes

  // Auto-open Properties panel when element (image/text) is selected in edit mode
  useEffect(() => {
    if (selectedIds.length > 0 && !previewMode) {
      // Check if the selected element is an image or text type
      const selectedElement = elements.find(el => el.id === selectedIds[0]);
      if (selectedElement && (selectedElement.type === 'image' || selectedElement.type === 'text')) {
        setRightPanelTab('properties');
        setShowRightPanel(true);
      }
    }
  }, [selectedIds, previewMode, elements]);

  // History management
  const saveToHistory = useCallback(() => {
    const newState: HistoryState = {
      elements: JSON.parse(JSON.stringify(elements)),
      timestamp: Date.now()
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [elements, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setElements(JSON.parse(JSON.stringify(history[historyIndex - 1].elements)));
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setElements(JSON.parse(JSON.stringify(history[historyIndex + 1].elements)));
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'c':
            e.preventDefault();
            copySelected();
            break;
          case 'v':
            e.preventDefault();
            paste();
            break;
          case 'd':
            e.preventDefault();
            duplicateSelected();
            break;
          case 'a':
            e.preventDefault();
            selectAll();
            break;
          case 'g':
            e.preventDefault();
            if (e.shiftKey) ungroupSelected();
            else groupSelected();
            break;
          case '0':
            e.preventDefault();
            setZoom(100);
            break;
          case '1':
            e.preventDefault();
            fitToScreen();
            break;
          case '=':
          case '+':
            e.preventDefault();
            setZoom(prev => Math.min(500, prev + 10));
            break;
          case '-':
            e.preventDefault();
            setZoom(prev => Math.max(10, prev - 10));
            break;
        }
      } else if (e.key === 'Delete') {
        // Only Delete key deletes layers, not Backspace
        // Backspace is reserved for text editing
        deleteSelected();
      } else if (e.key === 'Backspace') {
        // Backspace should only work for text editing, not layer deletion
        // Check if user is in an input field - if so, don't delete layer
        const activeElement = document.activeElement;
        const isInInput = activeElement && (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable
        );
        // Only delete layer if NOT in an input field
        // This prevents accidental deletion when editing text
        if (!isInInput) {
          deleteSelected();
        }
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        nudgeSelected(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, elements]);

  // Element manipulation
  const addElement = (element: Omit<CanvasElement, 'id' | 'zIndex'>): string => {
    const newElement: CanvasElement = {
      ...element,
      id: Math.random().toString(36).substr(2, 9),
      zIndex: elements.length,
      visible: element.visible !== false,
      locked: element.locked || false,
      opacity: element.opacity ?? 1,
      rotation: element.rotation || 0
    };
    setElements(prev => [...prev, newElement]);
    setSelectedIds([newElement.id]);
    setHasUnsavedChanges(true); // Mark as having unsaved changes
    // Mark views as dirty: if element has no view, it appears on all views
    if (newElement.view) {
      setDirtyViewsForDesign(prev => new Set([...prev, newElement.view!]));
    } else {
      // Element without view appears on all views - mark all views dirty
      if (product?.design?.views) {
        const allViewKeys = product.design.views.map((v: ProductView) => v.key);
        setDirtyViewsForDesign(prev => new Set([...prev, ...allViewKeys]));
      }
    }
    saveToHistory();
    return newElement.id;
  };

  // Helper to constrain text element to print area when properties change
  const constrainTextToPrintArea = (element: CanvasElement, updates: Partial<CanvasElement>): Partial<CanvasElement> => {
    // Only constrain text elements (allow empty text)
    if (element.type !== 'text') return updates;

    // Find the placeholder for this element
    const placeholder = element.placeholderId
      ? placeholders.find((p) => p.id === element.placeholderId)
      : undefined;
    
    if (!placeholder) return updates;

    const printArea = {
      x: placeholder.x,
      y: placeholder.y,
      width: placeholder.width,
      height: placeholder.height,
    };

    // Calculate new text bounds with updated properties
    const newFontSize = updates.fontSize !== undefined ? updates.fontSize : element.fontSize || 24;
    const newLetterSpacing = updates.letterSpacing !== undefined ? updates.letterSpacing : element.letterSpacing || 0;
    const newRotation = updates.rotation !== undefined ? updates.rotation : element.rotation || 0;
    const newText = updates.text !== undefined ? updates.text : (element.text || '');

    // Calculate bounds - use minimum for empty text
    let rotatedWidth: number;
    let rotatedHeight: number;

    if (newText) {
      // Create a temporary canvas to measure text
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return updates;

      ctx.font = `${newFontSize}px ${updates.fontFamily || element.fontFamily || 'Arial'}`;
      const metrics = ctx.measureText(newText);
      // Add letter spacing to width (approximate: letterSpacing * (charCount - 1))
      const textWidth = metrics.width + (newLetterSpacing * Math.max(0, newText.length - 1));
      const textHeight = newFontSize * 1.2;

      // Account for rotation - calculate bounding box of rotated text
      const rad = (newRotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      rotatedWidth = textWidth * cos + textHeight * sin;
      rotatedHeight = textWidth * sin + textHeight * cos;
    } else {
      // Minimum bounds for empty text
      const minWidth = newFontSize * 0.5;
      const minHeight = newFontSize;
      const rad = (newRotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rad));
      const sin = Math.abs(Math.sin(rad));
      rotatedWidth = minWidth * cos + minHeight * sin;
      rotatedHeight = minWidth * sin + minHeight * cos;
    }

    // Constrain position if it would overflow
    const currentX = updates.x !== undefined ? updates.x : element.x;
    const currentY = updates.y !== undefined ? updates.y : element.y;

    let constrainedX = currentX;
    let constrainedY = currentY;

    // Only constrain if position is being updated or if size-affecting properties changed
    const sizeChanged = updates.fontSize !== undefined || updates.letterSpacing !== undefined || 
                       updates.rotation !== undefined || updates.text !== undefined || updates.fontFamily !== undefined;

    if (sizeChanged) {
      constrainedX = Math.max(printArea.x, Math.min(currentX, printArea.x + printArea.width - rotatedWidth));
      constrainedY = Math.max(printArea.y, Math.min(currentY, printArea.y + printArea.height - rotatedHeight));
    } else {
      // Just constrain position if it's being moved
      if (updates.x !== undefined || updates.y !== undefined) {
        constrainedX = Math.max(printArea.x, Math.min(currentX, printArea.x + printArea.width - rotatedWidth));
        constrainedY = Math.max(printArea.y, Math.min(currentY, printArea.y + printArea.height - rotatedHeight));
      }
    }

    // Return updates with constrained position if needed
    if (constrainedX !== currentX || constrainedY !== currentY) {
      return { ...updates, x: constrainedX, y: constrainedY };
    }

    return updates;
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(prev => {
      const updated = prev.map(el => {
        if (el.id === id) {
          // Apply constraints for text elements
          const constrainedUpdates = el.type === 'text' ? constrainTextToPrintArea(el, updates) : updates;
          const updatedEl = { ...el, ...constrainedUpdates };
          // Mark views as dirty: if element has no view, it appears on all views
          if (updatedEl.view) {
            setDirtyViewsForDesign(prevDirty => new Set([...prevDirty, updatedEl.view!]));
          } else {
            // Element without view appears on all views - mark all views dirty
            if (product?.design?.views) {
              const allViewKeys = product.design.views.map((v: ProductView) => v.key);
              setDirtyViewsForDesign(prevDirty => new Set([...prevDirty, ...allViewKeys]));
            }
          }
          return updatedEl;
        }
        return el;
      });
      return updated;
    });
    setHasUnsavedChanges(true); // Mark as having unsaved changes
    
    // Force transformer to update when text changes (for proper bounding box)
    if (updates.text !== undefined && selectedIds.includes(id) && transformerRef.current) {
      setTimeout(() => {
        if (transformerRef.current && stageRef.current) {
          const selectedNode = stageRef.current.findOne(`#${id}`);
          if (selectedNode) {
            transformerRef.current.nodes([selectedNode]);
            transformerRef.current.getLayer()?.batchDraw();
          }
        }
      }, 0);
    }
  };

  const deleteSelected = () => {
    if (selectedIds.length > 0) {
      setElements(prev => {
        const toDelete = prev.filter(el => selectedIds.includes(el.id));
        // Mark views of deleted elements as dirty
        toDelete.forEach(el => {
          if (el.view) {
            setDirtyViewsForDesign(prevDirty => new Set([...prevDirty, el.view!]));
          } else {
            // Element without view appears on all views - mark all views dirty
            if (product?.design?.views) {
              const allViewKeys = product.design.views.map((v: ProductView) => v.key);
              setDirtyViewsForDesign(prevDirty => new Set([...prevDirty, ...allViewKeys]));
            }
          }
        });
        return prev.filter(el => !selectedIds.includes(el.id));
      });
      setSelectedIds([]);
      setHasUnsavedChanges(true); // Mark as having unsaved changes
      saveToHistory();
    }
  };

  const copySelected = () => {
    // Implementation for copy
    toast.info('Copy functionality');
  };

  const paste = () => {
    // Implementation for paste
    toast.info('Paste functionality');
  };

  const duplicateSelected = () => {
    const selected = elements.filter(el => selectedIds.includes(el.id));
    const newElements = selected.map(el => ({
      ...el,
      id: Math.random().toString(36).substr(2, 9),
      x: el.x + 20,
      y: el.y + 20,
      zIndex: elements.length
    }));
    setElements(prev => [...prev, ...newElements]);
    setSelectedIds(newElements.map(el => el.id));
    saveToHistory();
  };

  const selectAll = () => {
    setSelectedIds(elements.map(el => el.id));
  };

  const groupSelected = () => {
    if (selectedIds.length > 1) {
      // Group implementation
      toast.info('Group functionality');
    }
  };

  const ungroupSelected = () => {
    // Ungroup implementation
    toast.info('Ungroup functionality');
  };

  const nudgeSelected = (direction: string) => {
    const delta = 1;
    const updates: { x?: number; y?: number } = {};
    if (direction === 'ArrowLeft') updates.x = -delta;
    if (direction === 'ArrowRight') updates.x = delta;
    if (direction === 'ArrowUp') updates.y = -delta;
    if (direction === 'ArrowDown') updates.y = delta;

    selectedIds.forEach(id => {
      const element = elements.find(el => el.id === id);
      if (element) {
        updateElement(id, {
          x: (element.x || 0) + (updates.x || 0),
          y: (element.y || 0) + (updates.y || 0)
        });
      }
    });
  };

  const bringToFront = (id: string) => {
    const maxZ = Math.max(...elements.map(el => el.zIndex));
    updateElement(id, { zIndex: maxZ + 1 });
  };

  const sendToBack = (id: string) => {
    const minZ = Math.min(...elements.map(el => el.zIndex));
    updateElement(id, { zIndex: minZ - 1 });
  };

  const fitToScreen = () => {
    // Implementation
    setZoom(100);
    setStagePos({ x: 0, y: 0 });
  };

  // Add image to canvas from URL
  const addImageToCanvas = useCallback((imageUrl: string) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Use selected placeholder if available, otherwise use first placeholder or printArea
      let targetPlaceholder = null;

      // Get the latest selected placeholder ID from ref
      const currentSelectedId = selectedPlaceholderIdRef.current;
      console.log('addImageToCanvas - selectedPlaceholderId (from ref):', currentSelectedId);
      console.log('addImageToCanvas - selectedPlaceholderId (from state):', selectedPlaceholderId);
      console.log('addImageToCanvas - available placeholders:', placeholders.map(p => p.id));

      if (currentSelectedId) {
        targetPlaceholder = placeholders.find(p => p.id === currentSelectedId) || null;
        console.log('Found placeholder by selectedPlaceholderId:', targetPlaceholder);
      }

      if (!targetPlaceholder && placeholders.length > 0) {
        targetPlaceholder = placeholders[0];
        console.log('Using first placeholder as fallback:', targetPlaceholder);
      }

      const targetArea = targetPlaceholder || printArea;
      console.log('Final target area for image:', {
        x: targetArea.x,
        y: targetArea.y,
        width: targetArea.width,
        height: targetArea.height,
        isPlaceholder: !!targetPlaceholder,
        placeholderId: targetPlaceholder?.id
      });

      // Calculate aspect ratios
      const imageAspect = img.width / img.height;
      const placeholderAspect = targetArea.width / targetArea.height;

      // Fit image within placeholder while maintaining aspect ratio
      let finalWidth: number;
      let finalHeight: number;

      if (imageAspect > placeholderAspect) {
        // Image is wider - fit to width
        finalWidth = targetArea.width;
        finalHeight = targetArea.width / imageAspect;
      } else {
        // Image is taller - fit to height
        finalHeight = targetArea.height;
        finalWidth = targetArea.height * imageAspect;
      }

      // Ensure image doesn't exceed placeholder dimensions
      finalWidth = Math.min(finalWidth, targetArea.width);
      finalHeight = Math.min(finalHeight, targetArea.height);

      // Center the image within the placeholder
      const x = targetArea.x + (targetArea.width - finalWidth) / 2;
      const y = targetArea.y + (targetArea.height - finalHeight) / 2;

      // Apply placeholder rotation if any
      const rotation = targetPlaceholder?.rotation || 0;

      console.log('Adding image to placeholder:', {
        placeholder: targetArea,
        imageSize: { width: img.width, height: img.height },
        finalSize: { width: finalWidth, height: finalHeight },
        position: { x, y },
        rotation
      });

      const elementId = addElement({
        type: 'image',
        imageUrl,
        x,
        y,
        width: finalWidth,
        height: finalHeight,
        rotation,
        placeholderId: targetPlaceholder?.id || undefined,
        view: currentView // Store which view this image belongs to
      });

      // Select the newly added image and open properties tab
      setSelectedIds([elementId]);
      setRightPanelTab('properties');
      setShowRightPanel(true);

      toast.success('Image added to canvas');
    };
    img.onerror = () => {
      toast.error('Failed to load image');
    };
    img.src = imageUrl;
  }, [placeholders, printArea, addElement]);

  // Toggle color selection
  const handleColorToggle = useCallback((color: string) => {
    setSelectedColors(prev => {
      if (prev.includes(color)) {
        // When deselecting a color, clear its size selection
        setSelectedSizesByColor(prevSizes => {
          const newSizes = { ...prevSizes };
          delete newSizes[color];
          return newSizes;
        });
        return prev.filter(c => c !== color);
      } else {
        // When selecting a color, make it the primary (first) color while preserving others
        const withoutColor = prev.filter(c => c !== color);
        return [color, ...withoutColor];
      }
    });
    setHasUnsavedChanges(true); // Mark as having unsaved changes
  }, []);

  // Toggle size selection (backward compatibility - for standalone size selection)
  const handleSizeToggle = useCallback((size: string) => {
    setSelectedSizes(prev => {
      if (prev.includes(size)) {
        return prev.filter(s => s !== size);
      } else {
        return [...prev, size];
      }
    });
  }, []);

  // Toggle size selection for a specific color (allows multiple sizes per color)
  const handleSizeToggleForColor = useCallback((color: string, size: string) => {
    setSelectedSizesByColor(prev => {
      const colorSizes = prev[color] || [];
      // If size is already selected, remove it; otherwise, add it
      const updatedSizes = colorSizes.includes(size)
        ? colorSizes.filter(s => s !== size)
        : [...colorSizes, size];
      return {
        ...prev,
        [color]: updatedSizes,
      };
    });
  }, []);

  // File upload - always adds to preview library for manual selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let successCount = 0;

    // Process each selected file
    Array.from(files).forEach((file) => {
      // Validation
      const maxSize = file.type === 'image/svg+xml' ? 20 * 1024 * 1024 : 100 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds ${maxSize / 1024 / 1024}MB limit`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        // Always add to preview library - user must click to add to canvas
        setUploadedImagePreview(prev => [...prev, imageUrl]);
        successCount++;
        if (successCount === Array.from(files).length) {
          toast.success(`${files.length} image${files.length > 1 ? 's' : ''} added to library`);
        }
      };
      reader.onerror = () => {
        toast.error(`Failed to read ${file.name}`);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same files can be selected again
    e.target.value = '';
  };

  // Handle image click from upload panel - apply to selected placeholder
  const handleImageClick = (imageUrl: string) => {
    if (selectedPlaceholderId) {
      setDesignUrlForView(currentView, selectedPlaceholderId, imageUrl);
      toast.success('Design applied to placeholder');
    } else if (placeholders.length === 1) {
      // Auto-select if only one placeholder
      setSelectedPlaceholderId(placeholders[0].id);
      selectedPlaceholderIdRef.current = placeholders[0].id;
      setDesignUrlForView(currentView, placeholders[0].id, imageUrl);
      toast.success('Design applied to placeholder');
    } else {
      toast.error('Please select a placeholder first');
    }
  };

  // Add text
  const handleAddText = () => {
    if (!textInput.trim()) {
      toast.error('Please enter some text');
      return;
    }

    // Require a placeholder - text must be created within a print area
    const targetPlaceholder = selectedPlaceholderIdRef.current
      ? placeholders.find(p => p.id === selectedPlaceholderIdRef.current)
      : (placeholders.length > 0 ? placeholders[0] : null);
    
    if (!targetPlaceholder) {
      toast.error('Please select a print area (placeholder) before adding text');
      return;
    }

    const targetArea = {
      x: targetPlaceholder.x,
      y: targetPlaceholder.y,
      width: targetPlaceholder.width,
      height: targetPlaceholder.height,
    };

    addElement({
      type: 'text',
      text: textInput,
      x: targetArea.x + targetArea.width / 2,
      y: targetArea.y + targetArea.height / 2,
      fontSize,
      fontFamily: selectedFont,
      fill: textColor,
      align: 'center',
      view: currentView,
      placeholderId: targetPlaceholder.id
    });
    setTextInput('');
    toast.success('Text added');
  };

  // Add text with params (for new TextPanel)
  const handleAddTextWithParams = (text: string, font: string) => {
    if (!text.trim()) return;

    // Require a placeholder - text must be created within a print area
    const targetPlaceholder = selectedPlaceholderIdRef.current
      ? placeholders.find(p => p.id === selectedPlaceholderIdRef.current)
      : (placeholders.length > 0 ? placeholders[0] : null);
    
    if (!targetPlaceholder) {
      toast.error('Please select a print area (placeholder) before adding text');
      return;
    }

    const targetArea = {
      x: targetPlaceholder.x,
      y: targetPlaceholder.y,
      width: targetPlaceholder.width,
      height: targetPlaceholder.height,
    };

    addElement({
      type: 'text',
      text: text,
      x: targetArea.x + targetArea.width / 2,
      y: targetArea.y + targetArea.height / 2,
      fontSize: 48, // Default larger size
      fontFamily: font,
      fill: '#000000',
      align: 'center',
      view: currentView,
      placeholderId: targetPlaceholder.id
    });

    // Select the newly added text and show properties
    // Note: addElement updates state asynchronously, so we might need to handle selection differently
    // But addElement sets selectedIds to the new element, so just showing the panel should work
    setRightPanelTab('properties');
    setShowRightPanel(true);

    toast.success('Text added');
  };

  // Add shape
  const handleAddShape = (shapeType: CanvasElement['shapeType']) => {
    // Use selected placeholder if available, otherwise use first placeholder or printArea
    const targetPlaceholder = selectedPlaceholderIdRef.current
      ? placeholders.find(p => p.id === selectedPlaceholderIdRef.current)
      : (placeholders.length > 0 ? placeholders[0] : null);
    const targetArea = targetPlaceholder || printArea;

    // Calculate size to fit within placeholder (max 100px or 80% of placeholder size)
    const maxSize = Math.min(100, Math.min(targetArea.width, targetArea.height) * 0.8);

    addElement({
      type: 'shape',
      shapeType,
      x: targetArea.x + targetArea.width / 2 - maxSize / 2,
      y: targetArea.y + targetArea.height / 2 - maxSize / 2,
      width: maxSize,
      height: maxSize,
      fillColor: '#000000',
      strokeColor: '#000000',
      strokeWidth: 2,
      view: currentView,
      placeholderId: targetPlaceholder?.id || undefined
    });
  };

  // Export
  const handleExport = (format: 'png' | 'jpg' | 'svg') => {
    if (!stageRef.current) return;

    const dataURL = stageRef.current.toDataURL({
      mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
      quality: 1,
      pixelRatio: 2
    });

    const link = document.createElement('a');
    link.download = `design.${format}`;
    link.href = dataURL;
    link.click();
    toast.success(`Design exported as ${format.toUpperCase()}`);
  };

  const handleExportPreview = async (format: 'png' | 'jpg' = 'png') => {
    try {
      if (!webglCanvasRef.current) {
        toast.error('Preview is not available to export');
        return;
      }

      let canvas = webglCanvasRef.current.querySelector('canvas');
      if (!canvas) {
        const divs = webglCanvasRef.current.querySelectorAll('div');
        for (const div of Array.from(divs)) {
          canvas = div.querySelector('canvas');
          if (canvas) break;
        }
      }

      if (!canvas) {
        toast.error('Could not find preview canvas to export');
        return;
      }

      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const quality = 1.0;

      // Ensure the latest frame is rendered before reading pixels
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            toast.error('Failed to generate image');
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `preview.${format}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          toast.success(`Preview exported as ${format.toUpperCase()}`);
        },
        mime,
        quality
      );
    } catch (err) {
      console.error('Error exporting preview image:', err);
      toast.error('Error exporting preview image');
    }
  };

  // Capture preview image from WebGL canvas
  const capturePreviewImage = useCallback(async (viewKey?: string): Promise<string | null> => {
    try {
      if (!webglCanvasRef.current) {
        console.warn('WebGL canvas ref not available');
        return null;
      }

      // Wait a bit for canvas to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Find the canvas element inside the WebGL container
      // The canvas might be directly in the div or nested
      let canvas = webglCanvasRef.current.querySelector('canvas');

      // If not found, try finding it in child elements
      if (!canvas) {
        const divs = webglCanvasRef.current.querySelectorAll('div');
        for (const div of Array.from(divs)) {
          canvas = div.querySelector('canvas');
          if (canvas) break;
        }
      }

      if (!canvas) {
        console.warn('Canvas element not found in WebGL container');
        return null;
      }

      // Convert canvas to blob and upload
      return new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            console.error('Failed to convert canvas to blob');
            resolve(null);
            return;
          }

          try {
            const formData = new FormData();
            const fileName = viewKey ? `preview-${viewKey}.png` : 'preview.png';
            formData.append('image', blob, fileName);

            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');

            const headers: HeadersInit = {};
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
              method: 'POST',
              headers,
              body: formData,
            });

            const data = await response.json();
            if (data.success && data.url) {
              console.log(`Preview image uploaded successfully for ${viewKey || 'current'} view:`, data.url);
              resolve(data.url);
            } else {
              console.error('Failed to upload preview image:', data.message || 'Unknown error');
              resolve(null);
            }
          } catch (error) {
            console.error('Error uploading preview image:', error);
            resolve(null);
          }
        }, 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Error capturing preview image:', error);
      return null;
    }
  }, []);

  // Capture preview images for all views
  const captureAllViewPreviews = useCallback(async (): Promise<Record<string, string>> => {
    const previewsByView: Record<string, string> = {};
    const views = product?.design?.views || [];

    if (views.length === 0) {
      console.warn('No views available to capture');
      return previewsByView;
    }

    // Store original view to restore later
    const originalView = currentView;

    for (const view of views) {
      const viewKey = view.key;
      toast.info(`Capturing preview for ${viewKey} view...`);

      // Switch to this view
      setCurrentView(viewKey as any);

      // Wait for view to switch and WebGL to render
      // Longer wait to ensure mockup loads and WebGL renders
      await new Promise(resolve => setTimeout(resolve, 800));

      // Additional frame wait to ensure canvas is fully rendered
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);

      // Capture the preview for this view
      const previewUrl = await capturePreviewImage(viewKey);

      if (previewUrl) {
        previewsByView[viewKey] = previewUrl;
        console.log(`Captured preview for ${viewKey}:`, previewUrl);
      } else {
        console.warn(`Failed to capture preview for ${viewKey} view`);
      }
    }

    // Restore original view
    setCurrentView(originalView as any);

    return previewsByView;
  }, [product?.design?.views, currentView, capturePreviewImage]);

  // Auto-save preview when entering Preview mode ONLY if design IMAGE changes (not color)
  useEffect(() => {
    if (!previewMode) return;
    if (isSavingPreview) return; // Avoid duplicate saves

    const cacheKey = getPreviewCacheKey(currentView);
    const isDirtyForDesign = dirtyViewsForDesign.has(currentView);

    // Only auto-save preview when the design IMAGE changes
    // Do NOT save just because color changed - design must change
    if (!isDirtyForDesign) {
      // No design image changes - don't auto-save
      return;
    }

    // Clear dirty flag since we're about to save
    setDirtyViewsForDesign(prev => {
      const next = new Set(prev);
      next.delete(currentView);
      return next;
    });

    // Auto-save preview to AWS and backend when design image changes
    const autoSavePreview = async () => {
      console.log(`Design image change detected for ${currentView} view, auto-saving preview...`);

      // Wait for WebGL to render
      await new Promise(resolve => setTimeout(resolve, 500));
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);

      setIsSavingPreview(true);
      try {
        const previewUrl = await capturePreviewImage(currentView);
        if (previewUrl) {
          console.log(`Auto-saved preview for ${currentView}:`, previewUrl);

          // Update local cache
          setPreviewCache(prev => ({
            ...prev,
            [cacheKey]: previewUrl
          }));
          setSavedPreviewImages(prev => ({
            ...prev,
            [currentView]: previewUrl
          }));

          // Save to backend if we have a storeProductId
          if (storeProductId) {
            try {
              const viewElements = elements.filter(el => el.view === currentView || (!el.view && currentView === 'front'));
              await storeProductsApi.updateDesignPreview(storeProductId, {
                viewKey: currentView,
                previewUrl,
                elements: viewElements,
                designUrlsByPlaceholder: designUrlsByPlaceholder[currentView] || {},
              });
              console.log(`Preview saved to backend for ${currentView}`);
            } catch (err) {
              console.error('Failed to save preview to backend:', err);
            }
          }
        }
      } catch (err) {
        console.error('Error auto-saving preview:', err);
      } finally {
        setIsSavingPreview(false);
      }
    };

    autoSavePreview();
  }, [previewMode, currentView, getPreviewCacheKey, dirtyViewsForDesign, capturePreviewImage, isSavingPreview, storeProductId, elements, designUrlsByPlaceholder]);

  // Publish current product + design to the merchant's store
  const handlePublishToStore = useCallback(async () => {
    try {
      if (!user) {
        // Save current design state to sessionStorage for restoration after login
        if (id) {
          try {
            const designState = {
              elements,
              selectedColors,
              selectedSizes,
              selectedSizesByColor,
              currentView,
              designUrlsByPlaceholder,
            };
            sessionStorage.setItem(`designer_state_${id}`, JSON.stringify(designState));
          } catch (err) {
            console.error('Failed to save design state:', err);
          }
        }
        
        // Redirect to auth page with return path
        navigate('/auth', {
          state: {
            from: {
              pathname: `/designer/${id}`,
            },
          },
        });
        return;
      }
      if (!['merchant', 'superadmin'].includes(user.role)) {
        toast.error('Only merchants or superadmins can publish');
        return;
      }
      if (!product) {
        toast.error('No product loaded');
        return;
      }
      setIsPublishing(true);

      // Define required variables from product and state
      const catalogProductId = product._id || product.id;
      const sellingPrice = product.catalogue?.basePrice || 0;
      const galleryImages = product.galleryImages || [];

      // Build design payload with current design state
      const designPayload = {
        views: product.design?.views || [],
        designUrlsByPlaceholder,
        elements: elements.map(el => ({
          ...el,
          // Include only serializable properties
        })),
        savedPreviewImages,
        displacementSettings,
      };

      // Build variants from selected colors and sizes
      const listingVariants: Array<{ color: string; size: string; price: number }> = [];
      selectedColors.forEach(color => {
        const sizesForColor = selectedSizesByColor[color] || selectedSizes;
        sizesForColor.forEach(size => {
          listingVariants.push({
            color,
            size,
            price: sellingPrice,
          });
        });
      });

      // Validate that we have at least some variants
      if (listingVariants.length === 0 && selectedColors.length > 0) {
        toast.error('Please select at least one size for your colors');
        return;
      }

      // --- CREATE DRAFT IN DATABASE ---
      // Create a draft store product with the entire elements array
      const draftPayload = {
        catalogProductId,
        sellingPrice,
        status: 'draft' as const,
        designData: {
          elements: elements, // Save entire elements array (do not rename fields)
          designUrlsByPlaceholder,
          views: product.design?.views || [],
          savedPreviewImages,
          displacementSettings,
          selectedColors, // Save selected colors
          selectedSizes, // Save selected sizes
          selectedSizesByColor, // Save size selections per color
          primaryColorHex, // Save primary color for garment tinting
        },
        // Optional: include basic product info if available
        title: product?.catalogue?.name,
        description: product?.catalogue?.description,
      };

      const draftResponse = await storeProductsApi.create(draftPayload);
      if (!draftResponse || !draftResponse.success) {
        toast.error('Failed to create draft: ' + (draftResponse?.message || 'Unknown error'));
        return;
      }

      const storeProductId = draftResponse.data?.storeProduct?._id || draftResponse.data?._id;
      if (!storeProductId) {
        toast.error('Failed to get draft ID from server response');
        return;
      }

      console.log('Draft created with storeProductId:', storeProductId);

      // --- NEW MOCKUP GENERATION FLOW ---

      // Check if product has sample mockups
      const sampleMockups = (product.design as any)?.sampleMockups || [];
      const hasSampleMockups = sampleMockups.length > 0;
      console.log('Mockup Generation Init:', { hasSampleMockups, count: sampleMockups.length, selectedColors });

      // Navigate to MockupsLibrary if sample mockups exist
      if (hasSampleMockups) {
        toast.success('Proceeding to library to select mockups.');

        navigate('/mockups-library', {
          state: {
            storeProductId, // Pass the draft ID
            productId: catalogProductId,
            baseSellingPrice: sellingPrice,
            title: product?.catalogue?.name,
            description: product?.catalogue?.description,
            galleryImages,
            designData: designPayload,
            variants: listingVariants,
            // Pass minimal data needed for composition
            sampleMockups,
            displacementSettings: product.design?.displacementSettings
          }
        });
      } else {
        // Fallback to legacy behavior if no sample mockups
        toast.success('Design ready. Continue in Listing editor to finish publishing.');
        navigate('/listing-editor', {
          state: {
            storeProductId, // Pass the draft ID
            productId: catalogProductId,
            baseSellingPrice: sellingPrice,
            title: product?.catalogue?.name,
            description: product?.catalogue?.description,
            galleryImages,
            designData: designPayload,
            variants: listingVariants,
          },
        });
      }

    } catch (e: any) {
      console.error('Publish error:', e);
      toast.error(e?.message || 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  }, [user, product, elements, currentView, selectedColors, selectedSizes, selectedSizesByColor, placeholders, PX_PER_INCH, stageSize, canvasPadding, navigate, savedPreviewImages, designUrlsByPlaceholder, displacementSettings]);

  const handleSave = async () => {
    try {
      if (!webglCanvasRef.current || !id) {
        toast.error('Preview is not available to save');
        return;
      }

      let canvas = webglCanvasRef.current.querySelector('canvas');
      if (!canvas) {
        const divs = webglCanvasRef.current.querySelectorAll('div');
        for (const div of Array.from(divs)) {
          canvas = div.querySelector('canvas');
          if (canvas) break;
        }
      }

      if (!canvas) {
        toast.error('Could not find preview canvas to save');
        return;
      }

      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);

      await new Promise<void>((resolve, reject) => {
        canvas!.toBlob(async (blob) => {
          if (!blob) {
            toast.error('Failed to generate image');
            reject(new Error('blob null'));
            return;
          }

          try {
            const formData = new FormData();
            formData.append('image', blob, `preview-${currentView}.png`);

            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            const headers: HeadersInit = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const uploadResp = await fetch(`${API_BASE_URL}/api/upload/image`, {
              method: 'POST',
              headers,
              body: formData,
              credentials: 'include',
            });
            const uploadJson = await uploadResp.json().catch(() => ({}));
            const uploadedUrl = uploadJson?.url as string | undefined;
            if (uploadResp.ok && uploadJson?.success && uploadedUrl) {
              const nextPreviewImages = { ...savedPreviewImages, [currentView]: uploadedUrl } as Record<string, string>;
              setSavedPreviewImages(nextPreviewImages);

              const saveResp = await fetch(`${API_BASE_URL}/api/auth/me/previews/${id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                credentials: 'include',
                body: JSON.stringify({ previews: { [currentView]: uploadedUrl } }),
              });
              const saveJson = await saveResp.json().catch(() => ({}));
              if (saveResp.ok && saveJson?.success) {
                toast.success('Preview saved');
                setHasUnsavedChanges(false); // Reset unsaved changes flag after successful save

                // Cache the preview with proper key
                const cacheKey = getPreviewCacheKey(currentView);
                setPreviewCache(prev => ({
                  ...prev,
                  [cacheKey]: uploadedUrl
                }));

                // Also update savedPreviewImages for backward compatibility
                const nextPreviewImages = { ...savedPreviewImages, [currentView]: uploadedUrl } as Record<string, string>;
                setSavedPreviewImages(nextPreviewImages);

                resolve();
              } else {
                toast.error('Uploaded image, but failed to save to user previews');
                resolve();
              }
            } else {
              toast.error('Failed to upload preview image');
              resolve();
            }
          } catch (e) {
            console.error('Error saving preview image:', e);
            toast.error('Error saving preview image');
            resolve();
          }
        }, 'image/png', 1.0);
      });
    } catch (e) {
      console.error('Save error:', e);
      toast.error('Failed to save');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <div className="h-[60px] border-b flex items-center justify-between px-4 bg-background z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <X className="w-5 h-5" />
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex <= 0}>
            <Undo2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo2 className="w-5 h-5" />
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button
            variant={activeTool === 'select' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTool('select')}
          >
            <Move className="w-4 h-4 mr-2" />
            Select
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={!previewMode ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPreviewMode(false)}
          >
            Edit
          </Button>
          <Button
            variant={previewMode ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setPreviewMode(true);
              // Preview entry logic is handled in useEffect above
            }}
          >
            Preview
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button variant="default" size="sm" onClick={() => handleExportPreview('png')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools (hidden in preview mode) */}
        {!previewMode && (
          <aside className="w-[80px] border-r flex flex-col">
            <ScrollArea className="flex-1">
              <div className="flex flex-col">
                {tools.map((tool) => (
                  <Button
                    key={tool.label}
                    variant={activeTool === tool.toolKey ? 'default' : 'outline'}
                    size="icon"
                    onClick={tool.onClick}
                    className="h-16 w-20 rounded-none  border-none"
                    title={tool.label}
                  >
                    <tool.icon className="w-10 h-10" />
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Left Panel - Upload Panel (hidden in preview mode) */}
        {!previewMode && showLeftPanel && (
          <div className="w-[250px] border-r bg-background flex flex-col">
            <ScrollArea className="flex-1">
              {activeTool === 'upload' && (
                <UploadPanel
                  onFileUpload={handleFileUpload}
                  onUploadClick={() => document.getElementById('file-upload')?.click()}
                  imagePreview={uploadedImagePreview}
                  // Add uploaded images to canvas like other asset panels
                  onImageClick={addImageToCanvas}
                  selectedPlaceholderId={selectedPlaceholderId}
                  placeholders={placeholders.map(p => ({
                    id: p.id,
                    x: p.x,
                    y: p.y,
                    width: p.width,
                    height: p.height,
                    rotation: p.rotation,
                  }))}
                />
              )}
              {activeTool === 'text' && (
                <TextPanel
                  onAddText={(text, font) => {
                    // Update state for text addition
                    setTextInput(text);
                    setSelectedFont(font);
                    // We need to wait for state update or pass directly to addElement
                    // Since handleAddText uses state, we'll modify it slightly or create a new handler
                    // For now, let's call a modified version of handleAddText that accepts params
                    handleAddTextWithParams(text, font);
                  }}
                  onClose={() => setShowLeftPanel(false)}
                />
              )}
              {activeTool === 'shapes' && (
                <ShapesPanel
                  onAddShape={handleAddShape}
                  onAddAsset={addImageToCanvas}
                  selectedPlaceholderId={selectedPlaceholderId}
                  placeholders={placeholders}
                />
              )}
              {activeTool === 'library' && (
                <LibraryPanel
                  onAddAsset={addImageToCanvas}
                  selectedPlaceholderId={selectedPlaceholderId}
                  placeholders={placeholders}
                />
              )}
              {activeTool === 'graphics' && (
                <GraphicsPanel
                  onAddAsset={addImageToCanvas}
                  selectedPlaceholderId={selectedPlaceholderId}
                  placeholders={placeholders}
                />
              )}
              {activeTool === 'patterns' && (
                <AssetPanel
                  onAddAsset={addImageToCanvas}
                  category="patterns"
                  title="Patterns"
                  selectedPlaceholderId={selectedPlaceholderId}
                  placeholders={placeholders}
                />
              )}
              {activeTool === 'logos' && (
                <LogosPanel
                  onAddAsset={addImageToCanvas}
                  selectedPlaceholderId={selectedPlaceholderId}
                  placeholders={placeholders}
                />
              )}
              {activeTool === 'templates' && (
                <TemplatesPanel />
              )}
            </ScrollArea>
          </div>
        )}

        {/* Main Canvas Area - Always WebGL with Konva Overlay */}
        <div className="flex-1 min-h-0 flex flex-col items-center bg-muted/30 relative overflow-y-auto">
          {isLoadingProduct ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading product...</p>
              </div>
            </div>
          ) : currentViewData ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <div
                ref={webglCanvasRef}
                className="relative bg-white shadow-lg"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center'
                }}
              >
                {previewMode && (() => {
                  const cacheKey = getPreviewCacheKey(currentView);
                  const cachedPreview = previewCache[cacheKey];
                  const isDirtyForColor = dirtyViewsForColor.has(currentView);
                  const isDirtyForDesign = dirtyViewsForDesign.has(currentView);

                  // Show cached preview only if view is clean AND cache exists
                  if (!isDirtyForColor && !isDirtyForDesign && cachedPreview) {
                    return (
                      <img
                        src={cachedPreview}
                        alt="Cached preview"
                        className="block max-w-full max-h-full"
                        style={{
                          display: 'block',
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    );
                  }

                  // Otherwise show live WebGL (rendered below)
                  return null;
                })()}
                {(
                  <RealisticWebGLPreview
                    key={`preview-${currentView}-${currentViewData?.mockupImageUrl ? currentViewData.mockupImageUrl.slice(-20) : 'no-mockup'}-${getDesignUrlsHash(currentView)}`}
                    mockupImageUrl={
                      currentViewData?.mockupImageUrl &&
                        typeof currentViewData.mockupImageUrl === 'string' &&
                        currentViewData.mockupImageUrl.trim() !== ''
                        ? currentViewData.mockupImageUrl
                        : null
                    }
                    activePlaceholder={
                      currentViewData.placeholders?.find(
                        (p) => p.id === selectedPlaceholderId,
                      )
                        ? ({
                          ...currentViewData.placeholders.find(
                            (p) => p.id === selectedPlaceholderId,
                          )!,
                          rotationDeg:
                            currentViewData.placeholders.find(
                              (p) => p.id === selectedPlaceholderId,
                            )?.rotationDeg ?? 0,
                        } as any)
                        : null
                    }
                    placeholders={
                      (currentViewData.placeholders || []).map((p) => ({
                        ...p,
                        rotationDeg: p.rotationDeg ?? 0,
                      })) as any
                    }
                    physicalWidth={
                      product?.design?.physicalDimensions?.width ??
                      DEFAULT_PHYSICAL_WIDTH
                    }
                    physicalHeight={
                      product?.design?.physicalDimensions?.height ??
                      DEFAULT_PHYSICAL_HEIGHT
                    }
                    settings={displacementSettings}
                    onSettingsChange={handleDisplacementSettingsChange}
                    onDesignUpload={(placeholderId, designUrl) => {
                      setDesignUrlForView(currentView, placeholderId, designUrl);
                    }}
                    designUrlsByPlaceholder={getDesignUrlsForView(currentView)}
                    onSelectPlaceholder={(id) => {
                      if (id) {
                        console.log('Placeholder selected via WebGL:', id);
                        setSelectedPlaceholderId(id);
                        selectedPlaceholderIdRef.current = id;
                        toast.info(`Placeholder ${id.slice(0, 8)}... selected`);
                      } else {
                        setSelectedPlaceholderId(null);
                        selectedPlaceholderIdRef.current = null;
                      }
                    }}
                    previewMode={previewMode}
                    garmentTintHex={primaryColorHex}
                    enableGarmentTint={true}
                    canvasElements={elements}
                    currentView={currentView}
                    canvasPadding={canvasPadding}
                    PX_PER_INCH={PX_PER_INCH}
                  />
                )}

                {/* Konva Overlay - Just for Grid & Rulers now */}
                {!previewMode && (
                  <div
                    className="absolute inset-0 pointer-events-auto"
                  >
                    <Stage
                      ref={stageRef}
                      width={stageSize.width}
                      height={stageSize.height}
                      onMouseDown={(e: any) => {
                        const clickedOnEmpty = e.target === e.target.getStage();
                        if (clickedOnEmpty) {
                          setSelectedIds([]);
                        }
                      }}
                      onTouchStart={(e: any) => {
                        const clickedOnEmpty = e.target === e.target.getStage();
                        if (clickedOnEmpty) {
                          setSelectedIds([]);
                        }
                      }}
                    >
                      <Layer listening={false}>
                        {/* Grid */}
                        {showGrid && (
                          <>
                            {Array.from({ length: Math.ceil(stageSize.width / 20) }).map((_, i) => (
                              <Line
                                key={`v-${i}`}
                                points={[i * 20, 0, i * 20, stageSize.height]}
                                stroke="#e0e0e0"
                                strokeWidth={0.5}
                              />
                            ))}
                            {Array.from({ length: Math.ceil(stageSize.height / 20) }).map((_, i) => (
                              <Line
                                key={`h-${i}`}
                                points={[0, i * 20, stageSize.width, i * 20]}
                                stroke="#e0e0e0"
                                strokeWidth={0.5}
                              />
                            ))}
                          </>
                        )}

                        {/* Rulers */}
                        {showRulers && (
                          <>
                            {/* Ruler backgrounds */}
                            <Rect x={0} y={0} width={stageSize.width} height={24} fill="#f8fafc" stroke="#e5e7eb" strokeWidth={1} listening={false} />
                            <Rect x={0} y={0} width={24} height={stageSize.height} fill="#f8fafc" stroke="#e5e7eb" strokeWidth={1} listening={false} />

                            {/* Unit labels */}
                            <Text x={4} y={6} text={"in"} fontSize={10} fill="#64748b" listening={false} />
                            <Text x={4} y={4} text={"in"} fontSize={10} fill="#64748b" listening={false} />

                            {/* Top ruler ticks and labels (inches) */}
                            {Array.from({ length: Math.ceil((stageSize.width - canvasPadding * 2) / PX_PER_INCH) + 1 }).map((_, i) => {
                              const x = Math.round(canvasPadding + i * PX_PER_INCH);
                              const isMajor = true; // inch marks only
                              return (
                                <Group key={`rt-${i}`} listening={false}>
                                  <Line points={[x, 24, x, 14]} stroke="#94a3b8" strokeWidth={1} />
                                  <Text x={x + 2} y={6} text={`${i}"`} fontSize={10} fill="#64748b" />
                                </Group>
                              );
                            })}

                            {/* Left ruler ticks and labels (inches) */}
                            {Array.from({ length: Math.ceil((stageSize.height - canvasPadding * 2) / PX_PER_INCH) + 1 }).map((_, i) => {
                              const y = Math.round(canvasPadding + i * PX_PER_INCH);
                              return (
                                <Group key={`rl-${i}`} listening={false}>
                                  <Line points={[24, y, 14, y]} stroke="#94a3b8" strokeWidth={1} />
                                  <Text x={4} y={y + 2} text={`${i}"`} fontSize={10} fill="#64748b" />
                                </Group>
                              );
                            })}
                          </>
                        )}
                      </Layer>

                      {/* Placeholder Outlines Layer (Konva) - independent of WebGL */}
                      <Layer>
                        {placeholders.map((ph) => {
                          const isSelected = selectedPlaceholderId === ph.id;
                          const stroke = isSelected ? '#db2777' : '#f472b6';
                          const fill = isSelected ? 'rgba(251, 207, 232, 0.25)' : 'rgba(251, 207, 232, 0.18)';

                          const commonHandlers = {
                            onClick: () => {
                              setSelectedPlaceholderId(ph.id);
                              selectedPlaceholderIdRef.current = ph.id;
                              toast.info(`Placeholder ${ph.id.slice(0, 8)}... selected`);
                            },
                            onTap: () => {
                              setSelectedPlaceholderId(ph.id);
                              selectedPlaceholderIdRef.current = ph.id;
                              toast.info(`Placeholder ${ph.id.slice(0, 8)}... selected`);
                            },
                          } as any;

                          if (ph.isPolygon && ph.polygonPointsPx && ph.polygonPointsPx.length >= 6) {
                            return (
                              <Line
                                key={ph.id}
                                points={ph.polygonPointsPx}
                                closed
                                stroke={stroke}
                                strokeWidth={1}
                                fill={fill}
                                listening
                                perfectDrawEnabled={false}
                                {...commonHandlers}
                              />
                            );
                          }

                          return (
                            <Rect
                              key={ph.id}
                              x={ph.x}
                              y={ph.y}
                              width={ph.width}
                              height={ph.height}
                              stroke={stroke}
                              strokeWidth={1}
                              fill={fill}
                              listening
                              {...commonHandlers}
                            />
                          );
                        })}
                      </Layer>

                      {/* Interactive Elements Layer */}
                      <Layer>
                        {elements
                          .filter((el) => el.view === currentView && el.visible !== false)
                          .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                          .map((el) => {
                            const placeholder = el.placeholderId
                              ? placeholders.find((p) => p.id === el.placeholderId)
                              : undefined;
                            const elPrintArea = placeholder
                              ? {
                                x: placeholder.x,
                                y: placeholder.y,
                                width: placeholder.width,
                                height: placeholder.height,
                                isPolygon: placeholder.isPolygon,
                                polygonPointsPx: placeholder.polygonPointsPx,
                              }
                              : printArea;

                            if (el.type === 'image') {
                              return (
                                <ImageElement
                                  key={el.id}
                                  element={el}
                                  isSelected={selectedIds.includes(el.id)}
                                  onSelect={() => setSelectedIds([el.id])}
                                  onUpdate={(updates) => updateElement(el.id, updates)}
                                  printArea={elPrintArea}
                                  isEditMode={!previewMode && !el.locked}
                                />
                              );
                            }
                            if (el.type === 'text') {
                              return (
                                <TextElement
                                  key={el.id}
                                  element={el}
                                  isSelected={selectedIds.includes(el.id)}
                                  onSelect={() => setSelectedIds([el.id])}
                                  onUpdate={(updates) => updateElement(el.id, updates)}
                                  printArea={elPrintArea}
                                  isEditMode={!previewMode && !el.locked}
                                />
                              );
                            }
                            return null;
                          })}

                        {/* X/Y axis guides and handles for active image (edit mode only) */}
                        {(!previewMode && selectedIds.length === 1) && (() => {
                          const sel = elements.find(e => e.id === selectedIds[0]);
                          if (!sel || sel.type !== 'image' || !sel.width || !sel.height) return null;
                          const ph = sel.placeholderId
                            ? placeholders.find(p => p.id === sel.placeholderId)
                            : undefined;
                          const area = ph
                            ? { x: ph.x, y: ph.y, width: ph.width, height: ph.height }
                            : printArea;
                          if (!area) return null;
                          const centerX = (sel.x || 0) + (sel.width || 0) / 2;
                          const centerY = (sel.y || 0) + (sel.height || 0) / 2;

                          const horizY = Math.max(area.y, Math.min(centerY, area.y + area.height));
                          const vertX = Math.max(area.x, Math.min(centerX, area.x + area.width));

                          const handleSize = 12;
                          const halfH = (sel.height || 0) / 2;
                          const halfW = (sel.width || 0) / 2;

                          const rightHandleX = centerX + halfW - handleSize / 2;
                          const topHandleY = centerY - halfH - handleSize / 2;

                          return (
                            <>
                              {/* Guide lines */}
                              <Line points={[area.x, horizY, area.x + area.width, horizY]} stroke="#ef4444" strokeWidth={1} dash={[6, 6]} listening={false} />
                              <Line points={[vertX, area.y, vertX, area.y + area.height]} stroke="#ef4444" strokeWidth={1} dash={[6, 6]} listening={false} />

                              {/* Horizontal resize handle (adjust width symmetrically) */}
                              <Rect
                                x={rightHandleX}
                                y={centerY - handleSize / 2}
                                width={handleSize}
                                height={handleSize}
                                fill="#22c55e"
                                stroke="#16a34a"
                                strokeWidth={1}
                                cornerRadius={2}
                                draggable
                                dragBoundFunc={(pos) => {
                                  // lock Y to center, constrain X inside area
                                  const y = centerY - handleSize / 2;
                                  const minX = area.x - handleSize / 2;
                                  const maxX = area.x + area.width - handleSize / 2;
                                  return { x: Math.max(minX, Math.min(pos.x, maxX)), y };
                                }}
                                onDragMove={(e) => {
                                  const handleX = e.target.x() + handleSize / 2;
                                  const newHalfW = Math.abs(handleX - centerX);
                                  let newW = Math.max(10, Math.min(newHalfW * 2, area.width));
                                  // Constrain so image stays within area horizontally
                                  const newX = Math.max(area.x, Math.min(centerX - newW / 2, area.x + area.width - newW));
                                  updateElement(sel.id, { width: newW, x: newX });
                                }}
                              />

                              {/* Vertical resize handle (adjust height symmetrically) */}
                              <Rect
                                x={centerX - handleSize / 2}
                                y={topHandleY}
                                width={handleSize}
                                height={handleSize}
                                fill="#22c55e"
                                stroke="#16a34a"
                                strokeWidth={1}
                                cornerRadius={2}
                                draggable
                                dragBoundFunc={(pos) => {
                                  // lock X to center, constrain Y inside area
                                  const x = centerX - handleSize / 2;
                                  const minY = area.y - handleSize / 2;
                                  const maxY = area.y + area.height - handleSize / 2;
                                  return { x, y: Math.max(minY, Math.min(pos.y, maxY)) };
                                }}
                                onDragMove={(e) => {
                                  const handleY = e.target.y() + handleSize / 2;
                                  const newHalfH = Math.abs(handleY - centerY);
                                  let newH = Math.max(10, Math.min(newHalfH * 2, area.height));
                                  // Constrain so image stays within area vertically
                                  const newY = Math.max(area.y, Math.min(centerY - newH / 2, area.y + area.height - newH));
                                  updateElement(sel.id, { height: newH, y: newY });
                                }}
                              />
                            </>
                          );
                        })()}

                        {/* Transformer for selected element - always visible when selected */}
                        {selectedIds.length === 1 && !previewMode && (
                          <Transformer
                            ref={transformerRef}
                            rotateEnabled={true}
                            borderEnabled={true}
                            borderStroke="#22c55e"
                            borderStrokeWidth={2}
                            anchorFill="#22c55e"
                            anchorStroke="#16a34a"
                            anchorStrokeWidth={1}
                            anchorSize={8}
                            keepRatio={false}
                            boundBoxFunc={(oldBox, newBox) => {
                              // Constrain transformer to print area if element has placeholder
                              const selectedElement = elements.find(e => e.id === selectedIds[0]);
                              if (selectedElement && selectedElement.placeholderId) {
                                const placeholder = placeholders.find(p => p.id === selectedElement.placeholderId);
                                if (placeholder) {
                                  const minX = placeholder.x;
                                  const minY = placeholder.y;
                                  const maxX = placeholder.x + placeholder.width;
                                  const maxY = placeholder.y + placeholder.height;
                                  
                                  return {
                                    ...newBox,
                                    x: Math.max(minX, Math.min(newBox.x, maxX - newBox.width)),
                                    y: Math.max(minY, Math.min(newBox.y, maxY - newBox.height)),
                                    width: Math.min(newBox.width, maxX - Math.max(minX, newBox.x)),
                                    height: Math.min(newBox.height, maxY - Math.max(minY, newBox.y)),
                                  };
                                }
                              }
                              return newBox;
                            }}
                          />
                        )}
                      </Layer>
                    </Stage>
                  </div>
                )}
              </div>

              {/* View Switcher */}
              {availableViews.length > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-background rounded-lg p-1 border shadow-lg">
                  {availableViews.map((viewKey) => (
                    <Button
                      key={viewKey}
                      variant={currentView === viewKey ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        // Log view switch for debugging
                        console.log('[DesignEditor] View switch:', {
                          from: currentView,
                          to: viewKey,
                          previewMode,
                          primaryColorHex,
                          elementsCount: elements.length,
                          elementsForNewView: elements.filter(e => e.view === viewKey || !e.view).length,
                          designUrlsForNewView: Object.keys(designUrlsByPlaceholder[viewKey] || {}).length,
                        });

                        // Explicitly preserve previewMode when switching views
                        const currentPreviewMode = previewModeRef.current;
                        setCurrentView(viewKey as any);
                        // Restore previewMode after view change to ensure it persists
                        if (currentPreviewMode !== previewMode) {
                          setPreviewMode(currentPreviewMode);
                        }
                        // Clear selected placeholder when switching views
                        setSelectedPlaceholderId(null);
                        selectedPlaceholderIdRef.current = null;
                        setSelectedIds([]);
                      }}
                    >
                      {viewKey.charAt(0).toUpperCase() + viewKey.slice(1)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Right Panel (hidden in preview mode) */}
        {!previewMode && showRightPanel && (
          <div className="w-[350px] border-l bg-background flex flex-col h-full">
            <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="w-full rounded-none border-b flex-shrink-0">
                <TabsTrigger value="product" className="flex-1">Product</TabsTrigger>
                <TabsTrigger value="properties" className="flex-1">Properties</TabsTrigger>
                <TabsTrigger value="layers" className="flex-1">Layers</TabsTrigger>
              </TabsList>

              <TabsContent value="product" className="flex-1 overflow-y-auto p-4 min-h-0">
                <ProductInfoPanel
                  product={product}
                  isLoading={isLoadingProduct}
                  selectedColors={selectedColors}
                  selectedSizes={selectedSizes}
                  selectedSizesByColor={selectedSizesByColor}
                  onColorToggle={handleColorToggle}
                  onSizeToggle={handleSizeToggle}
                  onSizeToggleForColor={handleSizeToggleForColor}
                  onPrimaryColorHexChange={(hex) => {
                    setPrimaryColorHex(hex);
                    setHasUnsavedChanges(true);
                  }}
                />
              </TabsContent>

              <TabsContent value="properties" className="flex-1 overflow-y-auto p-4 min-h-0">
                <PropertiesPanel
                  selectedPlaceholderId={selectedPlaceholderId}
                  placeholders={placeholders}
                  designUrlsByPlaceholder={getDesignUrlsForView(currentView)}
                  onDesignUpload={(placeholderId, designUrl) => {
                    setDesignUrlForView(currentView, placeholderId, designUrl);
                  }}
                  onDesignRemove={(placeholderId) => {
                    removeDesignUrlForView(currentView, placeholderId);
                  }}
                  displacementSettings={displacementSettings}
                  onDisplacementSettingsChange={handleDisplacementSettingsChange}
                  selectedElementIds={selectedIds}
                  elements={elements}
                  onElementUpdate={(updates) => {
                    selectedIds.forEach(id => updateElement(id, updates));
                    saveToHistory();
                  }}
                  onElementDelete={(id) => {
                    setElements(prev => prev.filter(el => el.id !== id));
                    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
                    setHasUnsavedChanges(true);
                    saveToHistory();
                  }}
                  PX_PER_INCH={PX_PER_INCH}
                  canvasPadding={canvasPadding}
                />
              </TabsContent>

              <TabsContent value="layers" className="flex-1 overflow-y-auto p-4 min-h-0">
                <LayersPanel
                  placeholders={placeholders}
                  selectedPlaceholderId={selectedPlaceholderId}
                  onSelectPlaceholder={(id) => {
                    setSelectedPlaceholderId(id);
                    selectedPlaceholderIdRef.current = id;
                    setSelectedIds([]);
                  }}
                  designUrlsByPlaceholder={getDesignUrlsForView(currentView)}
                  onDesignRemove={(placeholderId) => {
                    removeDesignUrlForView(currentView, placeholderId);
                  }}
                  elements={elements}
                  selectedIds={selectedIds}
                  onSelectElement={(id) => {
                    setSelectedIds([id]);
                    setSelectedPlaceholderId(null);
                    selectedPlaceholderIdRef.current = null;
                  }}
                  onUpdate={updateElement}
                  onDelete={(id) => {
                    setElements(prev => prev.filter(el => el.id !== id));
                    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
                    setHasUnsavedChanges(true); // Mark as having unsaved changes
                    saveToHistory();
                  }}
                  onReorder={(newOrder) => {
                    setElements(newOrder);
                    setHasUnsavedChanges(true); // Mark as having unsaved changes
                    saveToHistory();
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Bottom Bar (hidden in preview mode) */}
      {!previewMode && (
        <div className="h-[50px] border-t flex items-center justify-between px-4 bg-background">
          {/* <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowLeftPanel(!showLeftPanel)}>
              {showLeftPanel ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowRightPanel(!showRightPanel)}>
              {showRightPanel ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div> */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(prev => Math.max(10, prev - 10))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm w-16 text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setZoom(prev => Math.min(500, prev + 10))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={fitToScreen}>
              Fit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(100)}>
              100%
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showGrid ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={showRulers ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setShowRulers(!showRulers)}
            >
              <Ruler className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center">
            <Button
              variant="default"
              className='w-full'
              size="lg"
              onClick={handlePublishToStore}
              disabled={isPublishing}
            >
              {isPublishing ? 'Publishing...' : 'Add Product'}
            </Button>

          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
// Custom hook for loading images
const useImageLoader = (url: string | undefined) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = url;
  }, [url]);

  return image;
};

const ImageElement: React.FC<{
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  printArea?: { x: number; y: number; width: number; height: number; isPolygon?: boolean; polygonPointsPx?: number[] };
  isEditMode?: boolean;
}> = ({ element, isSelected, onSelect, onUpdate, printArea, isEditMode = true }) => {
  const image = useImageLoader(element.imageUrl);

  if (!image) return null;

  // Constrain image to print area when dragging
  const handleDragEnd = (e: any) => {
    let newX = e.target.x();
    let newY = e.target.y();

    if (printArea && element.width && element.height) {
      // Constrain position to keep image within print area
      newX = Math.max(printArea.x, Math.min(newX, printArea.x + printArea.width - element.width));
      newY = Math.max(printArea.y, Math.min(newY, printArea.y + printArea.height - element.height));
    }

    onUpdate({
      x: newX,
      y: newY
    });
  };

  // Constrain image size and position when transforming
  const handleTransformEnd = (e: any) => {
    const node = e.target;
    let newWidth = node.width() * node.scaleX();
    let newHeight = node.height() * node.scaleY();
    let newX = node.x();
    let newY = node.y();

    if (printArea) {
      // Constrain size to print area
      newWidth = Math.min(newWidth, printArea.width);
      newHeight = Math.min(newHeight, printArea.height);

      // Constrain position
      newX = Math.max(printArea.x, Math.min(newX, printArea.x + printArea.width - newWidth));
      newY = Math.max(printArea.y, Math.min(newY, printArea.y + printArea.height - newHeight));
    }

    onUpdate({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      rotation: node.rotation(),
    });
    node.scaleX(1);
    node.scaleY(1);
  };

  // Calculate flip scales
  const flipScaleX = element.flipX ? -1 : 1;
  const flipScaleY = element.flipY ? -1 : 1;

  // Calculate effective position for flipped images
  const effectiveX = element.flipX ? element.x + (element.width || 0) : element.x;
  const effectiveY = element.flipY ? element.y + (element.height || 0) : element.y;

  // Build filter array for Konva
  const filters: any[] = [];
  const filterConfig: any = {};

  // Apply filters if any are set
  if (element.brightness !== undefined && element.brightness !== 0) {
    filterConfig.brightness = element.brightness / 100; // -1 to 1
  }
  if (element.contrast !== undefined && element.contrast !== 0) {
    filterConfig.contrast = element.contrast; // -100 to 100
  }
  if (element.saturation !== undefined && element.saturation !== 0) {
    // Saturation is typically 0-2 range, where 1 is normal
    // For realistic blending, we want more control
    filterConfig.saturation = 1 + (element.saturation / 100);
  }
  if (element.blur !== undefined && element.blur > 0) {
    filterConfig.blurRadius = element.blur;
  }

  // Map blend mode to Konva's globalCompositeOperation
  const blendModeMap: Record<string, string> = {
    'normal': 'source-over',
    'multiply': 'multiply',
    'screen': 'screen',
    'overlay': 'overlay',
    'darken': 'darken',
    'lighten': 'lighten',
    'color-dodge': 'color-dodge',
    'color-burn': 'color-burn',
    'hard-light': 'hard-light',
    'soft-light': 'soft-light',
    'difference': 'difference',
    'exclusion': 'exclusion',
    'hue': 'hue',
    'saturation': 'saturation',
    'color': 'color',
    'luminosity': 'luminosity',
  };

  const compositeOperation = element.blendMode
    ? blendModeMap[element.blendMode] || 'source-over'
    : 'source-over';

  // Enhanced shadow with realistic opacity
  // Calculate shadow opacity based on shadowOpacity property
  const shadowAlpha = element.shadowOpacity !== undefined
    ? element.shadowOpacity
    : (element.shadowBlur && element.shadowBlur > 0 ? 0.5 : 0);

  // Convert shadow color with opacity for more realistic shadows
  const shadowColorWithAlpha = element.shadowColor
    ? (() => {
      // If shadowColor is hex, add alpha channel
      if (element.shadowColor.startsWith('#')) {
        const alphaHex = Math.round(shadowAlpha * 255).toString(16).padStart(2, '0');
        return element.shadowColor + alphaHex;
      }
      return element.shadowColor;
    })()
    : `rgba(0, 0, 0, ${shadowAlpha})`;

  // Constrain dragging within print area
  const dragBoundFunc = printArea && element.width && element.height
    ? (pos: { x: number; y: number }) => {
      const constrainedX = Math.max(printArea.x, Math.min(pos.x, printArea.x + printArea.width - element.width!));
      const constrainedY = Math.max(printArea.y, Math.min(pos.y, printArea.y + printArea.height - element.height!));
      return { x: constrainedX, y: constrainedY };
    }
    : undefined;

  // Common image props
  const imageProps = {
    id: element.id,
    image: image,
    x: effectiveX,
    y: effectiveY,
    width: element.width,
    height: element.height,
    scaleX: flipScaleX,
    scaleY: flipScaleY,
    opacity: element.opacity !== undefined ? element.opacity : 1,
    rotation: element.rotation,
    draggable: isEditMode && !element.locked,
    onClick: isEditMode ? onSelect : undefined,
    onDragEnd: isEditMode ? handleDragEnd : undefined,
    onTransformEnd: isEditMode ? handleTransformEnd : undefined,
    dragBoundFunc: isEditMode ? dragBoundFunc : undefined,
    // Enhanced shadow properties with realistic opacity
    shadowBlur: element.shadowBlur || 0,
    shadowOffsetX: element.shadowOffsetX || 0,
    shadowOffsetY: element.shadowOffsetY || 0,
    shadowColor: shadowColorWithAlpha,
    shadowOpacity: shadowAlpha,
    // Blend mode support
    globalCompositeOperation: compositeOperation,
    // Border properties (using stroke)
    stroke: (element.borderWidth || 0) > 0 ? element.borderColor : undefined,
    strokeWidth: element.borderWidth || 0,
    dash: element.borderStyle === 'dashed' ? [10, 5] : undefined,
    // Filters
    ...(Object.keys(filterConfig).length > 0 ? filterConfig : {}),
  };

  // Use Group with clipping to visually clip image to print area
  if (printArea) {
    // If polygon clip is available, use it
    if (printArea.isPolygon && printArea.polygonPointsPx && printArea.polygonPointsPx.length >= 6) {
      const pts = printArea.polygonPointsPx;
      return (
        <Group
          clipFunc={(ctx) => {
            ctx.beginPath();
            ctx.moveTo(pts[0], pts[1]);
            for (let i = 2; i < pts.length; i += 2) {
              ctx.lineTo(pts[i], pts[i + 1]);
            }
            ctx.closePath();
          }}
        >
          <Image {...imageProps} />
        </Group>
      );
    }

    // Fallback: rectangular clip (existing behavior)
    return (
      <Group
        clipX={printArea.x}
        clipY={printArea.y}
        clipWidth={printArea.width}
        clipHeight={printArea.height}
      >
        <Image {...imageProps} />
      </Group>
    );
  }

  return <Image {...imageProps} />;
};

const TextElement: React.FC<{
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  printArea?: { x: number; y: number; width: number; height: number; isPolygon?: boolean; polygonPointsPx?: number[] };
  isEditMode?: boolean;
}> = ({ element, isSelected, onSelect, onUpdate, printArea, isEditMode = true }) => {
  // Helper to calculate text bounding box considering rotation
  const getTextBounds = (text: string, fontSize: number, fontFamily: string, letterSpacing: number = 0, rotation: number = 0) => {
    // Create a temporary canvas to measure text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { width: 0, height: 0 };
    
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    // Add letter spacing to width (approximate: letterSpacing * (charCount - 1))
    const textWidth = metrics.width + (letterSpacing * Math.max(0, text.length - 1));
    const textHeight = fontSize * 1.2; // Approximate line height
    
    // Account for rotation - calculate bounding box of rotated text
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const rotatedWidth = textWidth * cos + textHeight * sin;
    const rotatedHeight = textWidth * sin + textHeight * cos;
    
    return { width: rotatedWidth, height: rotatedHeight };
  };

  // Constrain text to print area when dragging
  const handleDragEnd = (e: any) => {
    let newX = e.target.x();
    let newY = e.target.y();

    if (printArea) {
      const text = element.text || '';
      const fontSize = element.fontSize || 24;
      const bounds = text
        ? getTextBounds(
            text,
            fontSize,
            element.fontFamily || 'Arial',
            element.letterSpacing || 0,
            element.rotation || 0
          )
        : { width: fontSize * 0.5, height: fontSize }; // Minimum bounds for empty text
      
      // Constrain position to keep text within print area
      newX = Math.max(printArea.x, Math.min(newX, printArea.x + printArea.width - bounds.width));
      newY = Math.max(printArea.y, Math.min(newY, printArea.y + printArea.height - bounds.height));
    }

    onUpdate({
      x: newX,
      y: newY
    });
  };

  // Constrain text position when transforming
  const handleTransformEnd = (e: any) => {
    const node = e.target as any;
    let newX = node.x();
    let newY = node.y();
    const newRotation = node.rotation();

    if (printArea) {
      const text = element.text || '';
      const newFontSize = (node.fontSize?.() || element.fontSize || 24) * node.scaleY();
      const bounds = text
        ? getTextBounds(
            text,
            newFontSize,
            element.fontFamily || 'Arial',
            element.letterSpacing || 0,
            newRotation
          )
        : { width: newFontSize * 0.5, height: newFontSize }; // Minimum bounds for empty text

      // Constrain position
      newX = Math.max(printArea.x, Math.min(newX, printArea.x + printArea.width - bounds.width));
      newY = Math.max(printArea.y, Math.min(newY, printArea.y + printArea.height - bounds.height));
    }

    onUpdate({
      x: newX,
      y: newY,
      rotation: newRotation,
      fontSize: (node.fontSize?.() || element.fontSize || 24) * node.scaleY(),
    });
    node.scaleX(1);
    node.scaleY(1);
  };

  // Drag boundary function to prevent dragging outside print area
  // Always allow dragging even if text is empty (use minimum bounds)
  const dragBoundFunc = printArea
    ? (pos: { x: number; y: number }) => {
      const text = element.text || '';
      const fontSize = element.fontSize || 24;
      const bounds = text
        ? getTextBounds(
            text,
            fontSize,
            element.fontFamily || 'Arial',
            element.letterSpacing || 0,
            element.rotation || 0
          )
        : { width: fontSize * 0.5, height: fontSize }; // Minimum bounds for empty text
      
      const constrainedX = Math.max(printArea.x, Math.min(pos.x, printArea.x + printArea.width - bounds.width));
      const constrainedY = Math.max(printArea.y, Math.min(pos.y, printArea.y + printArea.height - bounds.height));
      return { x: constrainedX, y: constrainedY };
    }
    : undefined;

  // Map blend mode to Konva's globalCompositeOperation
  type CompositeOperation = 'source-over' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

  const blendModeMap: Record<string, CompositeOperation> = {
    'normal': 'source-over',
    'multiply': 'multiply',
    'screen': 'screen',
    'overlay': 'overlay',
    'darken': 'darken',
    'lighten': 'lighten',
    'color-dodge': 'color-dodge',
    'color-burn': 'color-burn',
    'hard-light': 'hard-light',
    'soft-light': 'soft-light',
    'difference': 'difference',
    'exclusion': 'exclusion',
    'hue': 'hue',
    'saturation': 'saturation',
    'color': 'color',
    'luminosity': 'luminosity',
  };

  const compositeOperation: CompositeOperation = element.blendMode
    ? (blendModeMap[element.blendMode] || 'source-over')
    : 'source-over';

  // Enhanced shadow with realistic opacity
  const shadowAlpha = element.shadowOpacity !== undefined
    ? element.shadowOpacity
    : (element.shadowBlur && element.shadowBlur > 0 ? 0.5 : 0);

  const shadowColorWithAlpha = element.shadowColor
    ? (() => {
      if (element.shadowColor.startsWith('#')) {
        const alphaHex = Math.round(shadowAlpha * 255).toString(16).padStart(2, '0');
        return element.shadowColor + alphaHex;
      }
      return element.shadowColor;
    })()
    : `rgba(0, 0, 0, ${shadowAlpha})`;

  // Parse fontStyle to determine bold/italic
  const isBold = element.fontStyle?.includes('bold') || false;
  const isItalic = element.fontStyle?.includes('italic') || false;
  const fontWeight = isBold ? 'bold' : 'normal';
  const fontStyle = isItalic ? 'italic' : 'normal';

  // Ensure text always has a value for rendering (empty string shows cursor)
  const displayText = element.text || '';
  
  // Calculate minimum bounding box for empty text
  const minWidth = element.fontSize ? element.fontSize * 0.5 : 24;
  const minHeight = element.fontSize || 24;

  const commonTextProps: any = {
    id: element.id,
    x: element.x,
    y: element.y,
    text: displayText || ' ', // Use space for empty text to maintain cursor
    fontSize: element.fontSize || 24,
    fontFamily: element.fontFamily || 'Arial',
    fontStyle: fontStyle,
    fontWeight: fontWeight,
    fill: element.fill || '#000000',
    opacity: element.opacity !== undefined ? element.opacity : 1,
    rotation: element.rotation || 0,
    draggable: isEditMode && !element.locked,
    onClick: isEditMode ? onSelect : undefined,
    onDragEnd: isEditMode ? handleDragEnd : undefined,
    onTransformEnd: isEditMode ? handleTransformEnd : undefined,
    dragBoundFunc: isEditMode ? dragBoundFunc : undefined,
    shadowBlur: element.shadowBlur || 0,
    shadowOffsetX: element.shadowOffsetX || 0,
    shadowOffsetY: element.shadowOffsetY || 0,
    shadowColor: shadowColorWithAlpha,
    shadowOpacity: shadowAlpha,
    globalCompositeOperation: compositeOperation as any,
  };

  // Render text with clipping to print area (similar to ImageElement)
  const renderText = () => {
    // Only render curved text if curveShape is explicitly set (not just when curved is toggled)
    if (element.curved && element.curveShape) {
      const text = element.text || '';
      const fontSize = element.fontSize || 24;
      const fontFamily = element.fontFamily || 'Arial';
      
      // Calculate text width to determine appropriate radius
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let textWidth = 100; // Default fallback
      
      if (ctx && text) {
        ctx.font = `${fontSize}px ${fontFamily}`;
        const metrics = ctx.measureText(text);
        textWidth = metrics.width + (element.letterSpacing || 0) * Math.max(0, text.length - 1);
      }
      
      // Calculate radius based on text width and available space in placeholder
      let radius = element.curveRadius || 200;
      
      // Ensure curve fits within placeholder bounds
      if (printArea) {
        const availableWidth = printArea.width;
        const availableHeight = printArea.height;
        
        // For arch shapes, radius should be at least half text width, but not exceed available space
        if (element.curveShape === 'arch-down' || element.curveShape === 'arch-up') {
          const minRadius = textWidth / 2;
          const maxRadius = Math.min(availableWidth / 2, availableHeight);
          radius = Math.max(minRadius, Math.min(radius, maxRadius));
        } else if (element.curveShape === 'circle') {
          // For circle, radius is limited by both width and height
          const maxRadius = Math.min(availableWidth / 2, availableHeight / 2);
          radius = Math.min(radius, maxRadius);
        }
      } else {
        // Fallback: ensure radius is at least half the text width
        radius = Math.max(radius, textWidth / 2);
      }
      
      let pathData = '';
      const curveShape = element.curveShape;
      
      if (curveShape === 'arch-down') {
        // Inverted U-shape - path centered at text position
        pathData = `M -${radius},0 A ${radius},${radius} 0 0,1 ${radius},0`;
      } else if (curveShape === 'arch-up') {
        // U-shape (flipped) - path centered at text position
        pathData = `M -${radius},0 A ${radius},${radius} 0 0,0 ${radius},0`;
      } else if (curveShape === 'circle') {
        // Full circle - path centered at text position
        pathData = `M 0,-${radius} A ${radius},${radius} 0 1,1 0,${radius} A ${radius},${radius} 0 1,1 0,-${radius}`;
      } else {
        // Default to arch-down
        pathData = `M -${radius},0 A ${radius},${radius} 0 0,1 ${radius},0`;
      }

      // TextPath: path is relative to (0,0), positioned at element.x, element.y
      // This keeps the text at the same position when curved
      return (
        <TextPath
          {...commonTextProps}
          data={pathData}
          align={element.align || 'center'}
          letterSpacing={element.letterSpacing}
          x={element.x}
          y={element.y}
          text={text || ' '} // Ensure text is passed
        />
      );
    }

    // For empty text, show a placeholder with cursor indicator and visible bounding box
    if (!displayText) {
      const fontSize = element.fontSize || 24;
      const cursorX = element.x;
      const cursorY = element.y + fontSize * 0.2; // Adjust for baseline
      
      return (
        <Group>
          {/* Visible text placeholder to maintain bounding box and show cursor area */}
          <Text
            {...commonTextProps}
            text=" " // Space to maintain cursor position and bounding box
            align={element.align || 'left'}
            letterSpacing={element.letterSpacing}
            fill={element.fill || '#000000'}
            opacity={0.3} // Semi-transparent to show it's a placeholder
          />
          {/* Visible cursor indicator for empty text */}
          <Line
            points={[cursorX, cursorY, cursorX, cursorY + fontSize * 0.8]}
            stroke={element.fill || '#000000'}
            strokeWidth={2}
            dash={[4, 4]}
            listening={false}
          />
        </Group>
      );
    }

    return (
      <Text
        {...commonTextProps}
        align={element.align}
        letterSpacing={element.letterSpacing}
      />
    );
  };

  // Apply clipping if printArea is defined
  if (printArea) {
    // If polygon clip is available, use it
    if (printArea.isPolygon && printArea.polygonPointsPx && printArea.polygonPointsPx.length >= 6) {
      const pts = printArea.polygonPointsPx;
      return (
        <Group
          clipFunc={(ctx) => {
            ctx.beginPath();
            ctx.moveTo(pts[0], pts[1]);
            for (let i = 2; i < pts.length; i += 2) {
              ctx.lineTo(pts[i], pts[i + 1]);
            }
            ctx.closePath();
          }}
        >
          {renderText()}
        </Group>
      );
    }

    // Fallback: rectangular clip
    return (
      <Group
        clipX={printArea.x}
        clipY={printArea.y}
        clipWidth={printArea.width}
        clipHeight={printArea.height}
      >
        {renderText()}
      </Group>
    );
  }

  // No clipping if no printArea
  return renderText();
};

const ShapeElement: React.FC<{
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  printArea?: { x: number; y: number; width: number; height: number; isPolygon?: boolean; polygonPointsPx?: number[] };
  isEditMode?: boolean;
}> = ({ element, isSelected, onSelect, onUpdate, printArea, isEditMode = true }) => {
  // Constrain shape to print area when dragging
  const handleDragEnd = (e: any) => {
    let newX = e.target.x();
    let newY = e.target.y();

    if (printArea && element.width && element.height) {
      // Constrain position to keep shape within print area
      newX = Math.max(printArea.x, Math.min(newX, printArea.x + printArea.width - element.width));
      newY = Math.max(printArea.y, Math.min(newY, printArea.y + printArea.height - element.height));
    }

    onUpdate({
      x: newX,
      y: newY
    });
  };

  // Constrain shape size and position when transforming
  const handleTransformEnd = (e: any) => {
    const node = e.target;
    let newWidth = node.width() * node.scaleX();
    let newHeight = node.height() * node.scaleY();
    let newX = node.x();
    let newY = node.y();

    if (printArea) {
      // Constrain size to print area
      newWidth = Math.min(newWidth, printArea.width);
      newHeight = Math.min(newHeight, printArea.height);

      // Constrain position
      newX = Math.max(printArea.x, Math.min(newX, printArea.x + printArea.width - newWidth));
      newY = Math.max(printArea.y, Math.min(newY, printArea.y + printArea.height - newHeight));
    }

    onUpdate({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      rotation: node.rotation(),
    });
    node.scaleX(1);
    node.scaleY(1);
  };

  // Map blend mode to Konva's globalCompositeOperation
  type CompositeOperation = 'source-over' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

  const blendModeMap: Record<string, CompositeOperation> = {
    'normal': 'source-over',
    'multiply': 'multiply',
    'screen': 'screen',
    'overlay': 'overlay',
    'darken': 'darken',
    'lighten': 'lighten',
    'color-dodge': 'color-dodge',
    'color-burn': 'color-burn',
    'hard-light': 'hard-light',
    'soft-light': 'soft-light',
    'difference': 'difference',
    'exclusion': 'exclusion',
    'hue': 'hue',
    'saturation': 'saturation',
    'color': 'color',
    'luminosity': 'luminosity',
  };

  const compositeOperation: CompositeOperation = element.blendMode
    ? (blendModeMap[element.blendMode] || 'source-over')
    : 'source-over';

  // Enhanced shadow with realistic opacity
  const shadowAlpha = element.shadowOpacity !== undefined
    ? element.shadowOpacity
    : (element.shadowBlur && element.shadowBlur > 0 ? 0.5 : 0);

  const shadowColorWithAlpha = element.shadowColor
    ? (() => {
      if (element.shadowColor.startsWith('#')) {
        const alphaHex = Math.round(shadowAlpha * 255).toString(16).padStart(2, '0');
        return element.shadowColor + alphaHex;
      }
      return element.shadowColor;
    })()
    : `rgba(0, 0, 0, ${shadowAlpha})`;

  const baseProps: any = {
    id: element.id,
    x: element.x,
    y: element.y,
    fill: element.fillColor || '#000000',
    stroke: element.strokeColor || '#000000',
    strokeWidth: element.strokeWidth || 2,
    opacity: element.opacity !== undefined ? element.opacity : 1,
    rotation: element.rotation || 0,
    draggable: isEditMode && !element.locked,
    onClick: isEditMode ? onSelect : undefined,
    onDragEnd: isEditMode ? handleDragEnd : undefined,
    onTransformEnd: isEditMode ? handleTransformEnd : undefined,
    shadowBlur: element.shadowBlur || 0,
    shadowOffsetX: element.shadowOffsetX || 0,
    shadowOffsetY: element.shadowOffsetY || 0,
    shadowColor: shadowColorWithAlpha,
    shadowOpacity: shadowAlpha,
    globalCompositeOperation: compositeOperation as any,
  };

  // Render different shapes based on shapeType
  if (element.shapeType === 'circle') {
    const radius = (element.width || 50) / 2;
    return (
      <Circle
        {...baseProps}
        radius={radius}
        x={(element.x || 0) + radius}
        y={(element.y || 0) + radius}
      />
    );
  }

  if (element.shapeType === 'triangle') {
    const size = element.width || 100;
    const points = [
      element.x + size / 2, element.y, // top
      element.x, element.y + size, // bottom left
      element.x + size, element.y + size // bottom right
    ];
    return (
      <RegularPolygon
        {...baseProps}
        sides={3}
        radius={size / 2}
        x={element.x + size / 2}
        y={element.y + size / 2}
      />
    );
  }

  if (element.shapeType === 'star') {
    const size = element.width || 100;
    return (
      <Star
        {...baseProps}
        numPoints={5}
        innerRadius={size * 0.3}
        outerRadius={size / 2}
        x={element.x + size / 2}
        y={element.y + size / 2}
      />
    );
  }

  if (element.shapeType === 'heart') {
    // Heart shape using a custom path
    const size = element.width || 100;
    const centerX = element.x + size / 2;
    const centerY = element.y + size / 2;
    const scale = size / 100;

    // Heart path coordinates
    const heartPath = `
      M ${centerX},${centerY + 20 * scale}
      C ${centerX},${centerY + 10 * scale} ${centerX - 20 * scale},${centerY - 10 * scale} ${centerX - 30 * scale},${centerY}
      C ${centerX - 40 * scale},${centerY + 10 * scale} ${centerX - 30 * scale},${centerY + 20 * scale} ${centerX - 20 * scale},${centerY + 30 * scale}
      L ${centerX},${centerY + 50 * scale}
      L ${centerX + 20 * scale},${centerY + 30 * scale}
      C ${centerX + 30 * scale},${centerY + 20 * scale} ${centerX + 40 * scale},${centerY + 10 * scale} ${centerX + 30 * scale},${centerY}
      C ${centerX + 20 * scale},${centerY - 10 * scale} ${centerX},${centerY + 10 * scale} ${centerX},${centerY + 20 * scale}
      Z
    `;

    return (
      <Shape
        {...baseProps}
        sceneFunc={(context, shape) => {
          const path = new Path2D(heartPath);
          context.fillStyle = baseProps.fill as string;
          context.strokeStyle = baseProps.stroke as string;
          context.lineWidth = baseProps.strokeWidth as number;
          context.fill(path);
          context.stroke(path);
          // @ts-ignore - fillStroke exists but types may not be updated
          shape.fillStroke();
        }}
      />
    );
  }

  // Default: rectangle
  return (
    <Rect
      {...baseProps}
      width={element.width}
      height={element.height}
      cornerRadius={element.cornerRadius}
    />
  );
};

const PropertiesPanel: React.FC<{
  selectedPlaceholderId: string | null;
  placeholders: Array<{ id: string; x: number; y: number; width: number; height: number; rotation: number; original: Placeholder }>;
  designUrlsByPlaceholder: Record<string, string>;
  onDesignUpload: (placeholderId: string, designUrl: string) => void;
  onDesignRemove: (placeholderId: string) => void;
  displacementSettings: DisplacementSettings;
  onDisplacementSettingsChange: (settings: DisplacementSettings) => void;
  selectedElementIds: string[];
  elements: CanvasElement[];
  onElementUpdate: (updates: Partial<CanvasElement>) => void;
  onElementDelete?: (id: string) => void;
  PX_PER_INCH: number;
  canvasPadding: number;
}> = ({
  selectedPlaceholderId,
  placeholders,
  designUrlsByPlaceholder,
  onDesignUpload,
  onDesignRemove,
  displacementSettings,
  onDisplacementSettingsChange,
  selectedElementIds,
  elements,
  onElementUpdate,
  onElementDelete,
  PX_PER_INCH,
  canvasPadding,
}) => {
    const [designTransforms, setDesignTransforms] = useState<Record<string, { x: number; y: number; scale: number }>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const selectedPlaceholder = selectedPlaceholderId
      ? placeholders.find(p => p.id === selectedPlaceholderId)
      : null;

    const selectedElement = selectedElementIds.length > 0
      ? elements.find(el => el.id === selectedElementIds[0])
      : null;

    // Handle design file upload for placeholder
    const handleDesignFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!selectedPlaceholderId || !e.target.files?.[0]) return;

      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data.success && data.url) {
          onDesignUpload(selectedPlaceholderId, data.url);
          toast.success('Design uploaded successfully');
        } else {
          toast.error('Failed to upload design');
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload design');
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };

    // Show placeholder properties when placeholder is selected
    // if (selectedPlaceholderId && selectedPlaceholder) {
    //   const designUrl = designUrlsByPlaceholder[selectedPlaceholderId];
    //   const transform = designTransforms[selectedPlaceholderId] || { x: 0, y: 0, scale: 1 };

    //   return (
    //     <div className="space-y-6">
    //       {/* Size Section */}
    //       {/* {designUrl && (
    //         <div className="space-y-4">
    //           <h3 className="text-sm font-semibold">Size</h3>
    //           <div className="space-y-2">
    //             <div>
    //               <Label className="text-xs">Width: {Math.round(selectedPlaceholder.width * PX_PER_INCH)}px</Label>
    //               <Slider
    //                 value={[selectedPlaceholder.width * PX_PER_INCH]}
    //                 onValueChange={([value]) => {
    //                   // Update placeholder width
    //                   const newWidth = value / PX_PER_INCH;
    //                   // This would need to be handled by a callback, but keeping structure for now
    //                 }}
    //                 min={10}
    //                 max={1000}
    //                 step={1}
    //               />
    //             </div>
    //             <div>
    //               <Label className="text-xs">Height: {Math.round(selectedPlaceholder.height * PX_PER_INCH)}px</Label>
    //               <Slider
    //                 value={[selectedPlaceholder.height * PX_PER_INCH]}
    //                 onValueChange={([value]) => {
    //                   // Update placeholder height
    //                   const newHeight = value / PX_PER_INCH;
    //                   // This would need to be handled by a callback, but keeping structure for now
    //                 }}
    //                 min={10}
    //                 max={1000}
    //                 step={1}
    //               />
    //             </div>
    //             <div className="flex items-center gap-2">
    //               <input
    //                 type="checkbox"
    //                 id="lockAspect"
    //                 className="w-4 h-4"
    //                 checked={false}
    //                 onChange={() => {}}
    //               />
    //               <Label htmlFor="lockAspect" className="text-xs cursor-pointer">
    //                 🔒 Lock aspect ratio
    //               </Label>
    //             </div>
    //           </div>
    //         </div>
    //       )} */}

    //       {/* Position Section */}
    //       {/* {designUrl && (
    //         <div className="space-y-4">
    //           <h3 className="text-sm font-semibold">Position</h3>
    //           <div className="space-y-2">
    //             <div>
    //               <div className="flex items-center justify-between mb-1">
    //                 <Label className="text-xs">X: {Math.round(transform.x * PX_PER_INCH)}px</Label>
    //               </div>
    //               <Slider
    //                 value={[transform.x * PX_PER_INCH]}
    //                 onValueChange={([value]) => {
    //                   setDesignTransforms(prev => ({
    //                     ...prev,
    //                     [selectedPlaceholderId]: { ...transform, x: value / PX_PER_INCH },
    //                   }));
    //                 }}
    //                 min={0}
    //                 max={1000}
    //                 step={1}
    //               />
    //             </div>
    //             <div>
    //               <div className="flex items-center justify-between mb-1">
    //                 <Label className="text-xs">Y: {Math.round(transform.y * PX_PER_INCH)}px</Label>
    //               </div>
    //               <Slider
    //                 value={[transform.y * PX_PER_INCH]}
    //                 onValueChange={([value]) => {
    //                   setDesignTransforms(prev => ({
    //                     ...prev,
    //                     [selectedPlaceholderId]: { ...transform, y: value / PX_PER_INCH },
    //                   }));
    //                 }}
    //                 min={0}
    //                 max={1000}
    //                 step={1}
    //               />
    //             </div>
    //           </div>
    //         </div>
    //       )} */}

    //       {/* Flip Section */}
    //       {/* {designUrl && (
    //         <div className="space-y-4">
    //           <h3 className="text-sm font-semibold">Flip</h3>
    //           <div className="space-y-2">
    //             <div className="flex items-center gap-2">
    //               <input
    //                 type="checkbox"
    //                 id="flipH"
    //                 className="w-4 h-4"
    //                 checked={false}
    //                 onChange={() => {}}
    //               />
    //               <Label htmlFor="flipH" className="text-xs cursor-pointer">
    //                 ↔️ Horizontal
    //               </Label>
    //             </div>
    //             <div className="flex items-center gap-2">
    //               <input
    //                 type="checkbox"
    //                 id="flipV"
    //                 className="w-4 h-4"
    //                 checked={false}
    //                 onChange={() => {}}
    //               />
    //               <Label htmlFor="flipV" className="text-xs cursor-pointer">
    //                 ↕️ Vertical
    //               </Label>
    //             </div>
    //           </div>
    //         </div>
    //       )} */}

    //       {/* Opacity Section */}
    //       {/* {designUrl && (
    //         <div className="space-y-4">
    //           <h3 className="text-sm font-semibold">Opacity</h3>
    //           <div className="space-y-2">
    //             <div>
    //               <Label className="text-xs">Opacity: 100%</Label>
    //               <Slider
    //                 value={[100]}
    //                 onValueChange={() => {}}
    //                 min={0}
    //                 max={100}
    //                 step={1}
    //               />
    //             </div>
    //           </div>
    //         </div>
    //       )} */}

    //       {/* Blend Mode Section */}
    //       {/* {designUrl && (
    //         <div className="space-y-4">
    //           <h3 className="text-sm font-semibold">Blend Mode</h3>
    //           <select
    //             className="w-full px-3 py-2 border rounded-md bg-background text-sm"
    //             value="normal"
    //             onChange={() => {}}
    //           >
    //             <option value="normal">Normal</option>
    //             <option value="multiply">Multiply</option>
    //             <option value="screen">Screen</option>
    //             <option value="overlay">Overlay</option>
    //             <option value="darken">Darken</option>
    //             <option value="lighten">Lighten</option>
    //           </select>
    //           <p className="text-xs text-muted-foreground">
    //             Adjusts how the design blends with the mockup
    //           </p>
    //         </div>
    //       )} */}

    //       {/* Tune Realism (Displacement Settings) */}
    //       <div className="space-y-4">
    //         <h3 className="text-sm font-semibold">Tune Realism</h3>
    //         <div className="space-y-2">
    //           <div>
    //             <div className="flex items-center justify-between mb-1">
    //               <Label className="text-xs">Displacement X</Label>
    //               <span className="text-xs">{displacementSettings.scaleX}</span>
    //             </div>
    //             <Slider
    //               value={[displacementSettings.scaleX]}
    //               onValueChange={([value]) => {
    //                 onDisplacementSettingsChange({
    //                   ...displacementSettings,
    //                   scaleX: value
    //                 });
    //               }}
    //               min={0}
    //               max={100}
    //               step={1}
    //             />
    //           </div>
    //           <div>
    //             <div className="flex items-center justify-between mb-1">
    //               <Label className="text-xs">Displacement Y</Label>
    //               <span className="text-xs">{displacementSettings.scaleY}</span>
    //             </div>
    //             <Slider
    //               value={[displacementSettings.scaleY]}
    //               onValueChange={([value]) => {
    //                 onDisplacementSettingsChange({
    //                   ...displacementSettings,
    //                   scaleY: value
    //                 });
    //               }}
    //               min={0}
    //               max={100}
    //               step={1}
    //             />
    //           </div>
    //           <div>
    //             <div className="flex items-center justify-between mb-1">
    //               <Label className="text-xs">Fold Contrast</Label>
    //               <span className="text-xs">{displacementSettings.contrastBoost.toFixed(1)}</span>
    //             </div>
    //             <Slider
    //               value={[displacementSettings.contrastBoost]}
    //               onValueChange={([value]) => {
    //                 onDisplacementSettingsChange({
    //                   ...displacementSettings,
    //                   contrastBoost: value
    //                 });
    //               }}
    //               min={1}
    //               max={5}
    //               step={0.1}
    //             />
    //           </div>
    //         </div>
    //       </div>
    //     </div>
    //   );
    // }

    // Show element properties when element is selected
    if (selectedElement) {
      const element = selectedElement;
      const onUpdate = onElementUpdate;

      // Calculate position percentages for text elements
      const getPositionPercent = (element: CanvasElement, axis: 'x' | 'y') => {
        if (element.type !== 'text' || !element.placeholderId) return 0;
        const placeholder = placeholders.find(p => p.id === element.placeholderId);
        if (!placeholder) return 0;
        const value = axis === 'x' ? element.x : element.y;
        const size = axis === 'x' ? placeholder.width : placeholder.height;
        const offset = axis === 'x' ? placeholder.x : placeholder.y;
        return Math.round(((value - offset) / size) * 100 * 100) / 100; // Round to 2 decimals
      };

      const updatePositionPercent = (axis: 'x' | 'y', percent: number) => {
        if (element.type !== 'text' || !element.placeholderId) return;
        const placeholder = placeholders.find(p => p.id === element.placeholderId);
        if (!placeholder) return;
        const size = axis === 'x' ? placeholder.width : placeholder.height;
        const offset = axis === 'x' ? placeholder.x : placeholder.y;
        const newValue = offset + (size * percent / 100);
        onUpdate({ [axis]: newValue });
      };

      return (
        <div className="space-y-6">
          {element.type === 'text' && (
            <>
              {/* Layers Section */}
              <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-semibold">Layers</Label>
                <div className="p-3 border rounded-lg bg-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded border bg-muted flex items-center justify-center flex-shrink-0">
                        <Type className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{element.text || 'Text'}</p>
                        <p className="text-xs text-muted-foreground">{element.fontFamily || 'Arial'}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        const elementId = selectedElementIds[0];
                        if (elementId && onElementDelete) {
                          onElementDelete(elementId);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Text Input */}
                <div>
                  <Label className="text-sm">Text</Label>
                  <Input
                    value={element.text || ''}
                    onChange={(e) => onUpdate({ text: e.target.value })}
                    className="mt-1"
                  />
                </div>

                {/* Font Family */}
                <div>
                  <Label className="text-sm">Font Family</Label>
                  <select
                    value={element.fontFamily || 'Arial'}
                    onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm mt-1"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <optgroup label="Google Fonts">
                      {['ABeeZee', 'Abel', 'Abril Fatface', 'Acme', 'Aladin', 'Alex Brush', 'Anton', 'Bangers', 'Caveat', 'Cinzel', 'Comfortaa', 'Dancing Script', 'Great Vibes', 'Indie Flower', 'Lobster', 'Montserrat', 'Open Sans', 'Oswald', 'Pacifico', 'Playfair Display', 'Poppins', 'Raleway', 'Roboto', 'Rubik'].map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm">Font Size</Label>
                    <span className="text-xs text-muted-foreground">{element.fontSize || 24}</span>
                  </div>
                  <Slider
                    value={[element.fontSize || 24]}
                    onValueChange={([value]) => onUpdate({ fontSize: value })}
                    min={8}
                    max={500}
                    step={1}
                  />
                </div>

                {/* Bold and Italic */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={element.fontStyle?.includes('bold') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const currentStyle = element.fontStyle || '';
                      const isBold = currentStyle.includes('bold');
                      let newStyle = '';
                      if (isBold) {
                        // Remove bold, keep italic if present
                        newStyle = currentStyle.replace(/\bbold\b/g, '').trim();
                        if (currentStyle.includes('italic')) {
                          newStyle = newStyle ? newStyle + ' italic' : 'italic';
                        }
                      } else {
                        // Add bold, keep italic if present
                        newStyle = currentStyle.includes('italic')
                          ? 'bold italic'
                          : 'bold';
                      }
                      onUpdate({ fontStyle: newStyle || undefined });
                    }}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={element.fontStyle?.includes('italic') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      const currentStyle = element.fontStyle || '';
                      const isItalic = currentStyle.includes('italic');
                      let newStyle = '';
                      if (isItalic) {
                        // Remove italic, keep bold if present
                        newStyle = currentStyle.replace(/\bitalic\b/g, '').trim();
                        if (currentStyle.includes('bold')) {
                          newStyle = newStyle ? newStyle + ' bold' : 'bold';
                        }
                      } else {
                        // Add italic, keep bold if present
                        newStyle = currentStyle.includes('bold')
                          ? 'bold italic'
                          : 'italic';
                      }
                      onUpdate({ fontStyle: newStyle || undefined });
                    }}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                </div>

                {/* Indentation Controls */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Indentation</Label>
                  <div className="flex items-center gap-1 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Shift text left (decrease x position)
                        const currentX = element.x;
                        const shiftAmount = (element.fontSize || 24) * 0.5; // Shift by half font size
                        onUpdate({ x: currentX - shiftAmount });
                      }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Shift text right (increase x position)
                        const currentX = element.x;
                        const shiftAmount = (element.fontSize || 24) * 0.5; // Shift by half font size
                        onUpdate({ x: currentX + shiftAmount });
                      }}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Text Alignment */}
                {/* <div className="flex items-center gap-2">
                  <Button
                    variant={element.align === 'left' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onUpdate({ align: 'left' })}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={element.align === 'center' || !element.align ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onUpdate({ align: 'center' })}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={element.align === 'right' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onUpdate({ align: 'right' })}
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div> */}

                {/* Color */}
                <div>
                  <Label className="text-sm">Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={element.fill || '#000000'}
                      onChange={(e) => onUpdate({ fill: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={element.fill || '#000000'}
                      onChange={(e) => onUpdate({ fill: e.target.value })}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Letter Spacing */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm">Letter Spacing</Label>
                    <span className="text-xs text-muted-foreground">{element.letterSpacing || 0}</span>
                  </div>
                  <Slider
                    value={[element.letterSpacing || 0]}
                    onValueChange={([value]) => onUpdate({ letterSpacing: value })}
                    min={-10}
                    max={50}
                    step={1}
                  />
                </div>

                {/* Curved Text */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Curved text</Label>
                    <Switch
                      checked={element.curved || false}
                      onCheckedChange={(checked) => {
                        // When toggling curved on, don't set curveShape yet - wait for user to choose
                        // When toggling off, clear both curved and curveShape
                        if (checked) {
                          onUpdate({ 
                            curved: true,
                            curveRadius: element.curveRadius || 200
                            // Don't set curveShape - wait for user to select arch up/down/circle
                          });
                        } else {
                          onUpdate({ 
                            curved: false,
                            curveShape: undefined,
                            curveRadius: undefined
                          });
                        }
                      }}
                    />
                  </div>

                  {element.curved && (
                    <>
                      {/* Curve Shape Options */}
                      <div className="flex gap-2">
                        <Button
                          variant={element.curveShape === 'arch-down' || (!element.curveShape && element.curved) ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => onUpdate({ curveShape: 'arch-down' })}
                        >
                          Arch Down
                        </Button>
                        <Button
                          variant={element.curveShape === 'arch-up' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => onUpdate({ curveShape: 'arch-up' })}
                        >
                          Arch Up
                        </Button>
                        <Button
                          variant={element.curveShape === 'circle' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => onUpdate({ curveShape: 'circle' })}
                        >
                          Circle
                        </Button>
                      </div>

                      {/* Curve Percentage */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-sm">Curve</Label>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(((element.curveRadius || 200) / 1000) * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[element.curveRadius || 200]}
                          onValueChange={([value]) => onUpdate({ curveRadius: value })}
                          min={50}
                          max={1000}
                          step={10}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Rotation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm">Rotate</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={Math.round(element.rotation || 0)}
                        onChange={(e) => onUpdate({ rotation: parseFloat(e.target.value) || 0 })}
                        className="w-16 h-8 text-sm"
                      />
                      <span className="text-xs text-muted-foreground">deg</span>
                    </div>
                  </div>
                  <Slider
                    value={[element.rotation || 0]}
                    onValueChange={([value]) => onUpdate({ rotation: value })}
                    min={-180}
                    max={180}
                    step={1}
                  />
                </div>

                {/* Position */}
                <div className="space-y-3 border-t pt-3">
                  <Label className="text-sm">Position</Label>
                  
                  {/* Position Left */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs">Position left</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const current = getPositionPercent(element, 'x');
                            updatePositionPercent('x', Math.max(0, current - 0.1));
                          }}
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          value={getPositionPercent(element, 'x').toFixed(2)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            updatePositionPercent('x', value);
                          }}
                          className="w-20 h-7 text-xs text-center"
                          step="0.1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const current = getPositionPercent(element, 'x');
                            updatePositionPercent('x', Math.min(100, current + 0.1));
                          }}
                        >
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Position Top */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs">Position top</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const current = getPositionPercent(element, 'y');
                            updatePositionPercent('y', Math.max(0, current - 0.1));
                          }}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          value={getPositionPercent(element, 'y').toFixed(2)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            updatePositionPercent('y', value);
                          }}
                          className="w-20 h-7 text-xs text-center"
                          step="0.1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const current = getPositionPercent(element, 'y');
                            updatePositionPercent('y', Math.min(100, current + 0.1));
                          }}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Graphics/Image/Shape Elements - Unified Controls */}
          {(element.type === 'image' || element.type === 'shape') && (
            <>
              {/* Layers Section */}
              <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-semibold">Layers</Label>
                <div className="p-3 border rounded-lg bg-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded border bg-muted flex items-center justify-center flex-shrink-0">
                        {element.type === 'image' ? (
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {element.type === 'image' ? 'Image' : element.shapeType || 'Shape'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {element.width ? `${Math.round(element.width)}×${Math.round(element.height || 0)}` : 'Element'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        const elementId = selectedElementIds[0];
                        if (elementId && onElementDelete) {
                          onElementDelete(elementId);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Transform Controls - Grid Layout */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Width */}
                  <div>
                    <Label className="text-sm">Width</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="number"
                        value={element.width ? (element.width / PX_PER_INCH).toFixed(2) : '0'}
                        onChange={(e) => {
                          const inches = parseFloat(e.target.value) || 0;
                          const pixels = inches * PX_PER_INCH;
                          if (element.lockAspectRatio && element.width && element.height) {
                            const aspectRatio = element.width / element.height;
                            onUpdate({ width: pixels, height: pixels / aspectRatio });
                          } else {
                            onUpdate({ width: pixels });
                          }
                        }}
                        className="w-full h-8 text-sm"
                        step="0.01"
                      />
                      <span className="text-xs text-muted-foreground">in</span>
                    </div>
                  </div>

                  {/* Height */}
                  <div>
                    <Label className="text-sm">Height</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="number"
                        value={element.height ? (element.height / PX_PER_INCH).toFixed(2) : '0'}
                        onChange={(e) => {
                          const inches = parseFloat(e.target.value) || 0;
                          const pixels = inches * PX_PER_INCH;
                          if (element.lockAspectRatio && element.width && element.height) {
                            const aspectRatio = element.width / element.height;
                            onUpdate({ height: pixels, width: pixels * aspectRatio });
                          } else {
                            onUpdate({ height: pixels });
                          }
                        }}
                        className="w-full h-8 text-sm"
                        step="0.01"
                      />
                      <span className="text-xs text-muted-foreground">in</span>
                    </div>
                  </div>

                  {/* Rotate */}
                  <div>
                    <Label className="text-sm">Rotate</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="number"
                        value={Math.round(element.rotation || 0)}
                        onChange={(e) => onUpdate({ rotation: parseFloat(e.target.value) || 0 })}
                        className="w-full h-8 text-sm"
                        step="1"
                      />
                      <span className="text-xs text-muted-foreground">deg</span>
                    </div>
                  </div>

                  {/* Scale */}
                  <div>
                    <Label className="text-sm">Scale</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="number"
                        value={element.scaleX ? Math.round(element.scaleX * 100 * 100) / 100 : '100'}
                        onChange={(e) => {
                          const scale = parseFloat(e.target.value) || 100;
                          const scaleValue = scale / 100;
                          // Update scale while preserving current dimensions
                          const currentWidth = element.width || 100;
                          const currentHeight = element.height || 100;
                          onUpdate({ 
                            scaleX: scaleValue, 
                            scaleY: scaleValue,
                            width: currentWidth * scaleValue,
                            height: currentHeight * scaleValue
                          });
                        }}
                        className="w-full h-8 text-sm"
                        step="0.01"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                {/* Position Controls */}
                <div className="space-y-3 border-t pt-3">
                  {/* Position Left */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs">Position left</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const placeholder = element.placeholderId
                              ? placeholders.find(p => p.id === element.placeholderId)
                              : null;
                            if (placeholder) {
                              const current = ((element.x - placeholder.x) / placeholder.width) * 100;
                              const newPercent = Math.max(0, current - 0.1);
                              const newValue = placeholder.x + (placeholder.width * newPercent / 100);
                              onUpdate({ x: newValue });
                            }
                          }}
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          value={(() => {
                            const placeholder = element.placeholderId
                              ? placeholders.find(p => p.id === element.placeholderId)
                              : null;
                            if (placeholder) {
                              return (((element.x - placeholder.x) / placeholder.width) * 100).toFixed(2);
                            }
                            return '0';
                          })()}
                          onChange={(e) => {
                            const placeholder = element.placeholderId
                              ? placeholders.find(p => p.id === element.placeholderId)
                              : null;
                            if (placeholder) {
                              const percent = parseFloat(e.target.value) || 0;
                              const newValue = placeholder.x + (placeholder.width * percent / 100);
                              onUpdate({ x: newValue });
                            }
                          }}
                          className="w-20 h-7 text-xs text-center"
                          step="0.1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const placeholder = element.placeholderId
                              ? placeholders.find(p => p.id === element.placeholderId)
                              : null;
                            if (placeholder) {
                              const current = ((element.x - placeholder.x) / placeholder.width) * 100;
                              const newPercent = Math.min(100, current + 0.1);
                              const newValue = placeholder.x + (placeholder.width * newPercent / 100);
                              onUpdate({ x: newValue });
                            }
                          }}
                        >
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Position Top */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs">Position top</Label>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const placeholder = element.placeholderId
                              ? placeholders.find(p => p.id === element.placeholderId)
                              : null;
                            if (placeholder) {
                              const current = ((element.y - placeholder.y) / placeholder.height) * 100;
                              const newPercent = Math.max(0, current - 0.1);
                              const newValue = placeholder.y + (placeholder.height * newPercent / 100);
                              onUpdate({ y: newValue });
                            }
                          }}
                        >
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          value={(() => {
                            const placeholder = element.placeholderId
                              ? placeholders.find(p => p.id === element.placeholderId)
                              : null;
                            if (placeholder) {
                              return (((element.y - placeholder.y) / placeholder.height) * 100).toFixed(2);
                            }
                            return '0';
                          })()}
                          onChange={(e) => {
                            const placeholder = element.placeholderId
                              ? placeholders.find(p => p.id === element.placeholderId)
                              : null;
                            if (placeholder) {
                              const percent = parseFloat(e.target.value) || 0;
                              const newValue = placeholder.y + (placeholder.height * percent / 100);
                              onUpdate({ y: newValue });
                            }
                          }}
                          className="w-20 h-7 text-xs text-center"
                          step="0.1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const placeholder = element.placeholderId
                              ? placeholders.find(p => p.id === element.placeholderId)
                              : null;
                            if (placeholder) {
                              const current = ((element.y - placeholder.y) / placeholder.height) * 100;
                              const newPercent = Math.min(100, current + 0.1);
                              const newValue = placeholder.y + (placeholder.height * newPercent / 100);
                              onUpdate({ y: newValue });
                            }
                          }}
                        >
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Alignment Buttons */}
                  <div className="space-y-2 pt-2">
                    {/* Horizontal Alignment */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const placeholder = element.placeholderId
                            ? placeholders.find(p => p.id === element.placeholderId)
                            : null;
                          if (placeholder && element.width) {
                            onUpdate({ x: placeholder.x });
                          }
                        }}
                      >
                        <AlignLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const placeholder = element.placeholderId
                            ? placeholders.find(p => p.id === element.placeholderId)
                            : null;
                          if (placeholder && element.width) {
                            onUpdate({ x: placeholder.x + (placeholder.width / 2) - (element.width / 2) });
                          }
                        }}
                      >
                        <AlignCenter className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const placeholder = element.placeholderId
                            ? placeholders.find(p => p.id === element.placeholderId)
                            : null;
                          if (placeholder && element.width) {
                            onUpdate({ x: placeholder.x + placeholder.width - element.width });
                          }
                        }}
                      >
                        <AlignRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Vertical Alignment */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const placeholder = element.placeholderId
                            ? placeholders.find(p => p.id === element.placeholderId)
                            : null;
                          if (placeholder) {
                            onUpdate({ y: placeholder.y });
                          }
                        }}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const placeholder = element.placeholderId
                            ? placeholders.find(p => p.id === element.placeholderId)
                            : null;
                          if (placeholder && element.height) {
                            onUpdate({ y: placeholder.y + (placeholder.height / 2) - (element.height / 2) });
                          }
                        }}
                      >
                        <ArrowUp className="w-4 h-4" />
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const placeholder = element.placeholderId
                            ? placeholders.find(p => p.id === element.placeholderId)
                            : null;
                          if (placeholder && element.height) {
                            onUpdate({ y: placeholder.y + placeholder.height - element.height });
                          }
                        }}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    // Fallback when nothing is selected
    return (
      <div className="text-center text-muted-foreground py-8">
        <p className="text-sm">Select a placeholder or element to edit properties</p>
      </div>
    );
  };

const LayersPanel: React.FC<{
  placeholders: Array<{ id: string; x: number; y: number; width: number; height: number; rotation: number; original: Placeholder }>;
  selectedPlaceholderId: string | null;
  onSelectPlaceholder: (id: string | null) => void;
  designUrlsByPlaceholder: Record<string, string>;
  onDesignRemove: (placeholderId: string) => void;
  elements: CanvasElement[];
  selectedIds: string[];
  onSelectElement: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  onReorder: (newOrder: CanvasElement[]) => void;
}> = ({
  placeholders,
  selectedPlaceholderId,
  onSelectPlaceholder,
  designUrlsByPlaceholder,
  onDesignRemove,
  elements,
  selectedIds,
  onSelectElement,
  onUpdate,
  onDelete,
  onReorder,
}) => {
    return (
      <div className="space-y-4">
        {/* Placeholders Section */}
        {placeholders.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold uppercase text-muted-foreground">Placeholders</Label>
            <div className="space-y-2">
              {placeholders.map((placeholder) => {
                const designUrl = designUrlsByPlaceholder[placeholder.id];
                const isSelected = selectedPlaceholderId === placeholder.id;

                return (
                  <div
                    key={placeholder.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                      }`}
                    onClick={() => onSelectPlaceholder(placeholder.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded border bg-muted flex items-center justify-center flex-shrink-0">
                          {designUrl ? (
                            <img src={designUrl} alt="Design" className="w-full h-full object-contain rounded" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            Placeholder {placeholder.id.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {placeholder.original.widthIn.toFixed(1)}" × {placeholder.original.heightIn.toFixed(1)}"
                            {designUrl && ' • Design'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {designUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDesignRemove(placeholder.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Canvas Elements Section */}
        {elements.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <Label className="text-sm font-semibold uppercase text-muted-foreground">Canvas Elements</Label>
            <div className="space-y-2">
              {elements
                .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
                .map((element) => (
                  <div
                    key={element.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedIds.includes(element.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                      }`}
                    onClick={() => onSelectElement(element.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {element.type === 'image' && <ImageIcon className="w-4 h-4 flex-shrink-0" />}
                        {element.type === 'text' && <Type className="w-4 h-4 flex-shrink-0" />}
                        {element.type === 'shape' && <Square className="w-4 h-4 flex-shrink-0" />}
                        <span className="text-sm font-medium truncate">
                          {element.type === 'text' ? (element.text || 'Text') : `${element.type} ${element.id.slice(0, 4)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdate(element.id, { visible: element.visible !== false ? false : true });
                          }}
                        >
                          {element.visible !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(element.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {placeholders.length === 0 && elements.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No placeholders or elements</p>
          </div>
        )}
      </div>
    );
  };


// Panel Components - UploadPanel is now imported from shared component

const ShapesPanel: React.FC<{
  onAddShape: (shapeType: CanvasElement['shapeType']) => void;
  onAddAsset?: (assetUrl: string) => void;
  selectedPlaceholderId: string | null;
  placeholders: Array<{ id: string; x: number; y: number; width: number; height: number; rotation: number }>;
}> = ({ onAddShape, onAddAsset, selectedPlaceholderId, placeholders }) => {
  const [shapeAssets, setShapeAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Fetch shape assets from API
  useEffect(() => {
    const fetchShapeAssets = async () => {
      setLoadingAssets(true);
      try {
        const params = new URLSearchParams();
        params.append('category', 'shapes');
        params.append('limit', '20');

        const response = await fetch(`${API_BASE_URL}/assets?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setShapeAssets(data.data || []);
        } else {
          console.error('Failed to fetch shape assets:', data.message);
        }
      } catch (error) {
        console.error('Failed to fetch shape assets:', error);
        toast.error('Failed to load shape assets');
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchShapeAssets();
  }, []);

  return (
    <div className='flex flex-col gap-4'>
      <div className="p-4 space-y-4">
        {placeholders.length > 1 && (
          <div className="p-3 bg-muted rounded-lg border">
            <Label className="text-xs font-semibold text-foreground mb-1 block">
              {selectedPlaceholderId
                ? `Placeholder Selected: ${selectedPlaceholderId.slice(0, 8)}...`
                : 'Select a placeholder on canvas first'}
            </Label>
            <p className="text-xs text-muted-foreground">
              {selectedPlaceholderId
                ? 'Click a shape below to add it to the selected placeholder'
                : 'Click a placeholder on the canvas, then select a shape'}
            </p>
          </div>
        )}
        <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
          Basic Shapes
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddShape('rect')}
            className="h-16 flex flex-col gap-1"
          >
            <Square className="w-5 h-5" />
            <span className="text-xs">Rectangle</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddShape('circle')}
            className="h-16 flex flex-col gap-1"
          >
            <CircleIcon className="w-5 h-5" />
            <span className="text-xs">Circle</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddShape('triangle')}
            className="h-16 flex flex-col gap-1"
          >
            <Triangle className="w-5 h-5" />
            <span className="text-xs">Triangle</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddShape('star')}
            className="h-16 flex flex-col gap-1"
          >
            <StarIcon className="w-5 h-5" />
            <span className="text-xs">Star</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddShape('heart')}
            className="h-16 flex flex-col gap-1"
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs">Heart</span>
          </Button>
        </div>
      </div>
      <div className='p-2 space-y-4'>
        {placeholders.length > 1 && (
          <div className="p-2 bg-muted rounded-lg border mb-2">
            <Label className="text-xs font-semibold text-foreground mb-1 block">
              {selectedPlaceholderId
                ? `Placeholder Selected: ${selectedPlaceholderId.slice(0, 8)}...`
                : 'Select a placeholder on canvas first'}
            </Label>
            <p className="text-xs text-muted-foreground">
              {selectedPlaceholderId
                ? 'Click a shape below to add it to the selected placeholder'
                : 'Click a placeholder on the canvas, then select a shape'}
            </p>
          </div>
        )}
        <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
          Uploaded Shapes
        </Label>
        {loadingAssets ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : shapeAssets.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="grid grid-cols-2 gap-2">
              {shapeAssets.map((asset) => (
                <div
                  key={asset._id}
                  className="relative aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-colors group"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (asset.fileUrl && onAddAsset) {
                      onAddAsset(asset.fileUrl);
                    } else if (asset.fileUrl) {
                      toast.error('Asset handler not available');
                    }
                  }}
                  title={asset.title}
                >
                  {asset.previewUrl ? (
                    <img
                      src={asset.previewUrl}
                      alt={asset.title}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Folder className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {asset.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No shape assets found
          </div>
        )}
      </div>
    </div>
  );
};


const GraphicsPanel: React.FC<{
  onAddAsset: (assetUrl: string) => void;
  selectedPlaceholderId: string | null;
  placeholders: Array<{ id: string; x: number; y: number; width: number; height: number; rotation: number }>;
}> = ({ onAddAsset, selectedPlaceholderId, placeholders }) => {
  const [graphics, setGraphics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch graphics from API
  useEffect(() => {
    const fetchGraphics = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('category', 'graphics');
        if (searchTerm) params.append('search', searchTerm);
        params.append('limit', '50');

        const response = await fetch(`${API_BASE_URL}/assets?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setGraphics(data.data || []);
        } else {
          console.error('Failed to fetch graphics:', data.message);
        }
      } catch (error) {
        console.error('Failed to fetch graphics:', error);
        toast.error('Failed to load graphics');
      } finally {
        setLoading(false);
      }
    };

    fetchGraphics();
  }, [searchTerm]);

  return (
    <div className="p-4 space-y-4">
      {placeholders.length > 1 && (
        <div className="p-3 bg-muted rounded-lg border">
          <Label className="text-xs font-semibold text-foreground mb-1 block">
            {selectedPlaceholderId
              ? `Placeholder Selected: ${selectedPlaceholderId.slice(0, 8)}...`
              : 'Select a placeholder on canvas first'}
          </Label>
          <p className="text-xs text-muted-foreground">
            {selectedPlaceholderId
              ? 'Click a graphic below to add it to the selected placeholder'
              : 'Click a placeholder on the canvas, then select a graphic'}
          </p>
        </div>
      )}
      <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
        Graphics
      </Label>

      {/* Search */}
      <Input
        placeholder="Search graphics..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : graphics.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No graphics found
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="grid grid-cols-2 gap-2">
            {graphics.map((asset) => (
              <div
                key={asset._id}
                className="relative aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-colors group"
                onClick={(e) => {
                  e.stopPropagation();
                  if (asset.fileUrl) {
                    onAddAsset(asset.fileUrl);
                  } else {
                    toast.error('Asset file URL not available');
                  }
                }}
                title={asset.title}
              >
                {asset.previewUrl ? (
                  <img
                    src={asset.previewUrl}
                    alt={asset.title}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Folder className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {asset.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

const LogosPanel: React.FC<{
  onAddAsset: (assetUrl: string) => void;
  selectedPlaceholderId: string | null;
  placeholders: Array<{ id: string; x: number; y: number; width: number; height: number; rotation: number }>;
}> = ({ onAddAsset, selectedPlaceholderId, placeholders }) => {
  const [logos, setLogos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch logos from API
  useEffect(() => {
    const fetchLogos = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('category', 'logos');
        if (searchTerm) params.append('search', searchTerm);
        params.append('limit', '50');

        const response = await fetch(`${API_BASE_URL}/assets?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setLogos(data.data || []);
        } else {
          console.error('Failed to fetch logos:', data.message);
        }
      } catch (error) {
        console.error('Failed to fetch logos:', error);
        toast.error('Failed to load logos');
      } finally {
        setLoading(false);
      }
    };

    fetchLogos();
  }, [searchTerm]);

  return (
    <div className="p-4 space-y-4">
      {placeholders.length > 1 && (
        <div className="p-3 bg-muted rounded-lg border">
          <Label className="text-xs font-semibold text-foreground mb-1 block">
            {selectedPlaceholderId
              ? `Placeholder Selected: ${selectedPlaceholderId.slice(0, 8)}...`
              : 'Select a placeholder on canvas first'}
          </Label>
          <p className="text-xs text-muted-foreground">
            {selectedPlaceholderId
              ? 'Click a logo below to add it to the selected placeholder'
              : 'Click a placeholder on the canvas, then select a logo'}
          </p>
        </div>
      )}
      <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
        Logos
      </Label>

      {/* Search */}
      <Input
        placeholder="Search logos..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : logos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No logos found
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="grid grid-cols-2 gap-2">
            {logos.map((asset) => (
              <div
                key={asset._id}
                className="relative aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-colors group"
                onClick={(e) => {
                  e.stopPropagation();
                  if (asset.fileUrl) {
                    onAddAsset(asset.fileUrl);
                  } else {
                    toast.error('Asset file URL not available');
                  }
                }}
                title={asset.title}
              >
                {asset.previewUrl ? (
                  <img
                    src={asset.previewUrl}
                    alt={asset.title}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Folder className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {asset.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

interface LibraryPanelProps {
  onAddAsset: (assetUrl: string) => void;
  selectedPlaceholderId?: string | null;
  placeholders?: Array<{ id: string; x: number; y: number; width: number; height: number; rotation: number }>;
}

const LibraryPanel: React.FC<LibraryPanelProps> = ({ onAddAsset, selectedPlaceholderId, placeholders = [] }) => {
  const [assets, setAssets] = useState<any[]>([]);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('graphics');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { value: 'graphics', label: 'Graphics' },
    { value: 'patterns', label: 'Patterns' },
    { value: 'icons', label: 'Icons' },
    { value: 'shapes', label: 'Shapes' },
    { value: 'logos', label: 'Logos' },
    { value: 'all', label: 'All' }
  ];

  // Fetch assets from API
  useEffect(() => {
    const fetchAssets = async () => {
      // If "All" is selected, don't fetch - use allAssets instead
      if (selectedCategory === 'all') {
        setAssets([]); // Clear assets, we'll use allAssets for display
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append('category', selectedCategory);
        if (searchTerm) params.append('search', searchTerm);
        params.append('limit', '20');

        const response = await fetch(`${API_BASE_URL}/assets?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setAssets(data.data || []);
        } else {
          console.error('Failed to fetch assets:', data.message);
        }
      } catch (error) {
        console.error('Failed to fetch assets:', error);
        toast.error('Failed to load assets');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    const fetchAllAssets = async () => {
      try {
        // Fetch all assets without category filter - use higher limit for "All" view
        const response = await fetch(`${API_BASE_URL}/assets?limit=200`);
        const data = await response.json();

        if (data.success) {
          setAllAssets(data.data || []);
          console.log(`[LibraryPanel] Fetched ${data.data?.length || 0} total assets`);
        } else {
          console.error('[LibraryPanel] Failed to fetch all assets:', data.message);
          setAllAssets([]);
        }
      } catch (error) {
        console.error('[LibraryPanel] Failed to fetch all assets:', error);
        // Don't show toast for initial load, only show if user explicitly selects "All"
        setAllAssets([]);
      }
    };

    fetchAllAssets();
  }, []);

  return (
    <div className="p-4 space-y-4">
      {placeholders.length > 1 && (
        <div className="p-3 bg-muted rounded-lg border">
          <Label className="text-xs font-semibold text-foreground mb-1 block">
            {selectedPlaceholderId
              ? `Placeholder Selected: ${selectedPlaceholderId.slice(0, 8)}...`
              : 'Select a placeholder on canvas first'}
          </Label>
          <p className="text-xs text-muted-foreground">
            {selectedPlaceholderId
              ? 'Click an asset below to add it to the selected placeholder'
              : 'Click a placeholder on the canvas, then select an asset'}
          </p>
        </div>
      )}
      <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
        Asset Library
      </Label>

      {/* Search */}
      <Input
        placeholder="Search assets..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />

      {/* Category tabs */}
      <div className="flex gap-1 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.value)}
            className="text-xs"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (() => {
        // Determine which assets to display
        const assetsToDisplay = selectedCategory === 'all' ? allAssets : assets;

        // Filter by search term if provided
        const filteredAssets = searchTerm
          ? assetsToDisplay.filter((asset) =>
            asset.title?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          : assetsToDisplay;

        if (filteredAssets.length === 0) {
          return (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No assets found
            </div>
          );
        }

        return (
          <ScrollArea className="h-[500px]">
            <div className="grid grid-cols-2 gap-2">
              {filteredAssets.map((asset) => (
                <div
                  key={asset._id}
                  className="relative aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-colors group"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (asset.fileUrl) {
                      onAddAsset(asset.fileUrl);
                    } else {
                      toast.error('Asset file URL not available');
                    }
                  }}
                  title={asset.title}
                >
                  {asset.previewUrl ? (
                    <img
                      src={asset.previewUrl}
                      alt={asset.title}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Folder className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {asset.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        );
      })()}

    </div>
  );
};

interface AssetPanelProps {
  onAddAsset: (assetUrl: string) => void;
  category: string;
  title: string;
  selectedPlaceholderId: string | null;
  placeholders: Array<{ id: string; x: number; y: number; width: number; height: number; rotation: number }>;
}

const AssetPanel: React.FC<AssetPanelProps> = ({ onAddAsset, category, title, selectedPlaceholderId, placeholders }) => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch assets from API
  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('category', category);
        if (searchTerm) params.append('search', searchTerm);
        params.append('limit', '50');

        const response = await fetch(`${API_BASE_URL}/assets?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setAssets(data.data || []);
        } else {
          console.error(`Failed to fetch ${category} assets:`, data.message);
        }
      } catch (error) {
        console.error(`Failed to fetch ${category} assets:`, error);
        toast.error(`Failed to load ${title.toLowerCase()}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [category, searchTerm, title]);

  return (
    <div className="p-4 space-y-4">
      {placeholders.length > 1 && (
        <div className="p-3 bg-muted rounded-lg border">
          <Label className="text-xs font-semibold text-foreground mb-1 block">
            {selectedPlaceholderId
              ? `Placeholder Selected: ${selectedPlaceholderId.slice(0, 8)}...`
              : 'Select a placeholder on canvas first'}
          </Label>
          <p className="text-xs text-muted-foreground">
            {selectedPlaceholderId
              ? `Click a ${title.toLowerCase()} below to add it to the selected placeholder`
              : 'Click a placeholder on the canvas, then select a resource'}
          </p>
        </div>
      )}
      <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
        {title}
      </Label>

      {/* Search */}
      <Input
        placeholder={`Search ${title.toLowerCase()}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-2"
      />

      {/* Assets grid */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No {title.toLowerCase()} found
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="grid grid-cols-2 gap-2">
            {assets.map((asset) => (
              <div
                key={asset._id}
                className="relative aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-colors group"
                onClick={(e) => {
                  e.stopPropagation();
                  if (asset.fileUrl) {
                    onAddAsset(asset.fileUrl);
                  } else {
                    toast.error('Asset file URL not available');
                  }
                }}
                title={asset.title}
              >
                {asset.previewUrl ? (
                  <img
                    src={asset.previewUrl}
                    alt={asset.title}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Folder className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {asset.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

const TemplatesPanel: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch text templates from API
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/assets?category=textTemplates&limit=20`
        );
        const data = await response.json();

        if (data.success) {
          setTemplates(data.data || []);
        } else {
          console.error('Failed to fetch templates:', data.message);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
        toast.error('Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
        Templates
      </Label>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="aspect-square bg-muted rounded-lg border-2 border-dashed flex items-center justify-center">
              <Layout className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="aspect-square bg-muted rounded-lg border-2 border-dashed flex items-center justify-center">
              <Layout className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground py-4">
            No templates available. Upload some in Admin panel.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="grid grid-cols-2 gap-2">
            {templates.map((template) => (
              <div
                key={template._id}
                className="relative aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border hover:border-primary cursor-pointer transition-colors group"
                onClick={() => {
                  toast.info(`Add ${template.title} template functionality coming soon`);
                }}
                title={template.title}
              >
                {template.previewUrl ? (
                  <img
                    src={template.previewUrl}
                    alt={template.title}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Layout className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {template.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};


export default DesignEditor;

