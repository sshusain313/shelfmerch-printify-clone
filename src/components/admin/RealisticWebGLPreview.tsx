import React, { useEffect, useRef, useState } from 'react';
import { Application, Assets, ColorMatrixFilter, Container, DisplacementFilter, Graphics, Rectangle, Sprite } from 'pixi.js';
import type { DisplacementSettings, Placeholder } from '@/types/product';
import { createDisplacementTextureFromGarment } from '@/lib/displacementMap';
// Removed UI imports - this component is now a pure canvas renderer

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
  view?: string;
  imageUrl?: string;
  flipX?: boolean;
  flipY?: boolean;
  blendMode?: string;
}

interface RealisticWebGLPreviewProps {
  mockupImageUrl: string | null;
  activePlaceholder: Placeholder | null;
  placeholders: Placeholder[];
  physicalWidth?: number;
  physicalHeight?: number;
  settings: DisplacementSettings;
  onSettingsChange: (settings: DisplacementSettings) => void;
  // Design upload callback - called when a design is uploaded for a placeholder
  onDesignUpload?: (placeholderId: string, designUrl: string) => void;
  // Design URLs by placeholder ID (external state)
  designUrlsByPlaceholder?: Record<string, string>;
  // Overlay integration hooks - expose design transforms and bounds
  onDesignTransformChange?: (placeholderId: string, transform: { x: number; y: number; scale: number }) => void;
  // Read-only hooks for overlay to query current state
  getDesignTransform?: (placeholderId: string) => { x: number; y: number; scale: number } | null;
  getDesignBounds?: (placeholderId: string) => { x: number; y: number; width: number; height: number } | null;
  // Selection callback
  onSelectPlaceholder?: (placeholderId: string | null) => void;
  // Preview mode - hide placeholders when true
  previewMode?: boolean;
  // Optional garment tint derived from selected product color (hex string like #RRGGBB)
  garmentTintHex?: string | null;
  // Canvas elements support
  canvasElements?: CanvasElement[];
  currentView?: string;
  canvasPadding?: number;
  PX_PER_INCH?: number;
  // Enable garment tint (default: false) - only set to true if you want to apply color tint
  // When false, real per-color view images from variant.viewImages are used as-is
  enableGarmentTint?: boolean;
}

/**
 * Experimental WebGL-based realistic mockup preview using PixiJS v8.
 * - Uses current mockup image as garment
 * - Uses the active placeholder (in inches) as the print area
 * - Lets the admin upload a sample design and tune displacement settings
 *
 * This is purely an admin-side visual aid and does not affect print generation.
 */
export const RealisticWebGLPreview: React.FC<RealisticWebGLPreviewProps> = ({
  mockupImageUrl,
  activePlaceholder,
  placeholders,
  physicalWidth,
  physicalHeight,
  settings,
  onSettingsChange,
  onDesignUpload,
  designUrlsByPlaceholder: externalDesignUrls = {},
  onDesignTransformChange,
  getDesignTransform,
  getDesignBounds,
  onSelectPlaceholder,
  previewMode = false,
  garmentTintHex,
  canvasElements = [],
  currentView = 'front',
  canvasPadding = 40,
  PX_PER_INCH = 72,
  enableGarmentTint = false, // Default: disabled - use real variant images as-is
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const [appReady, setAppReady] = useState(false);
  // Use external designUrls if provided, otherwise fall back to internal state
  const [internalDesignUrls, setInternalDesignUrls] = useState<Record<string, string>>({});
  const designUrlsByPlaceholder = Object.keys(externalDesignUrls).length > 0
    ? externalDesignUrls
    : internalDesignUrls;
  const [activeDesignMetrics, setActiveDesignMetrics] = useState<{
    xIn: number;
    yIn: number;
    widthIn: number;
    heightIn: number;
  } | null>(null);
  // Token to force re-binding of filters when a new displacement filter is created
  const [filterToken, setFilterToken] = useState(0);
  // Match CanvasMockup / DesignEditor canvas dimensions exactly
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const CANVAS_PADDING = 40;

  // Keep track of Pixi scene objects
  const sceneRef = useRef<{
    garmentSprite: Sprite | null;
    designSprite: Sprite | null;
    displacementSprite: Sprite | null;
    displacementFilter: DisplacementFilter | null;
    mask: Graphics | null;
    designContainer: Container | null; // Root container for all design layers
    placeholderDesignLayer: Container | null; // Only placeholder designs + masks
    canvasElementsLayer: Container | null; // Only canvas element sprites
    placeholderContainer: Container | null;
    pxPerInch: number;
    canvasElementSprites: Map<string, Sprite>; // Track canvas element sprites by element ID
  }>({
    garmentSprite: null,
    designSprite: null,
    displacementSprite: null,
    displacementFilter: null,
    mask: null,
    designContainer: null,
    placeholderDesignLayer: null,
    canvasElementsLayer: null,
    placeholderContainer: null,
    pxPerInch: 1,
    canvasElementSprites: new Map(),
  });

  // Debug logging flag (set to true to enable)
  const DEBUG_LOGGING = true;

  // Token to trigger canvas elements reload after garment/containers are ready
  const [containersReady, setContainersReady] = useState(0);

  // Track previous mockup URL across renders to avoid unnecessary unloads
  const prevMockupUrlRef = useRef<string | null>(null);

  const hexToTint = (hex?: string | null): number | null => {
    if (!hex || typeof hex !== 'string') return null;
    const normalized = hex.trim().replace('#', '');
    if (normalized.length !== 6) return null;
    const n = Number.parseInt(normalized, 16);
    return Number.isNaN(n) ? null : n;
  };

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const normalized = hex.trim().replace('#', '');
    const match = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
    return match
      ? {
        r: Number.parseInt(match[1], 16),
        g: Number.parseInt(match[2], 16),
        b: Number.parseInt(match[3], 16),
      }
      : { r: 0, g: 0, b: 0 }; // Default to black if invalid hex
  };

  // Calculate luminance and determine if the color is dark
  // Uses standard luminance formula: luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B
  const isDarkHex = (hex?: string | null): boolean => {
    if (!hex || typeof hex !== 'string') return false;

    try {
      const rgb = hexToRgb(hex);
      // Calculate luminance using the standard formula (normalized to 0-1 range)
      const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;

      // Return true if luminance is below threshold (0.5 = medium gray)
      // Dark colors have a lower luminance value
      return luminance < 0.5;
    } catch {
      return false; // Default to light color if calculation fails
    }
  };

  // ========================================
  // REALISM TUNING PARAMETERS
  // ========================================
  // Adjust these values to balance between color preservation and fabric realism:
  // Higher values (0.95-1.0) = more color preservation, less fabric texture
  // Lower values (0.80-0.90) = more fabric texture, more color desaturation
  const REALISM_ALPHA = 0.92; // Trade-off: 0.92 gives subtle fabric texture with minimal color loss

  /**
   * Safely determine blend mode based on garment background.
   * CRITICAL: Multiply/screen blend modes require a background to work properly.
   * Without a background, multiply causes black/invisible designs.
   * Returns 'normal' if no garment background exists.
   */
  const getSafeBlendMode = (garmentHex: string | null | undefined, hasGarmentBg: boolean): string => {
    // Safety check: if no garment background, use normal blend to prevent black designs
    if (!hasGarmentBg) {
      return 'normal';
    }
    // With background, use appropriate blend mode
    if (garmentHex) {
      return isDarkHex(garmentHex) ? 'screen' : 'multiply';
    }
    return 'multiply'; // Default for light/untinted garments
  };

  // Initialize Pixi Application (v8 async init)
  // We initialize once on mount to ensure the canvas is always present,
  // regardless of when a mockup image or placeholder becomes available.
  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    const app = new Application();

    // Create a canvas and WebGL2 context with preserveDrawingBuffer enabled
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true }) as WebGL2RenderingContext | null;

    app
      .init({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundAlpha: 0,
        preference: 'webgl',
        view: canvas,
        context: gl || undefined,
      })
      .then(() => {
        if (containerRef.current) {
          containerRef.current.appendChild(app.canvas);
        }
        appRef.current = app;
        setAppReady(true);
      })
      .catch((err) => {
        console.error('Failed to initialize WebGL preview:', err);
      });

    return () => {
      if (appRef.current) {
        appRef.current.destroy(
          { removeView: true },
          { children: true, texture: true, textureSource: true },
        );
        appRef.current = null;
        setAppReady(false);
      }
    };
  }, []);

  // Load garment (mockup) and rebuild base scene
  useEffect(() => {
    if (!appReady || !appRef.current) return;

    // Validate mockupImageUrl before proceeding
    // Don't clear scene immediately - only clear if URL was previously valid and now invalid
    const hasValidUrl = mockupImageUrl && typeof mockupImageUrl === 'string' && mockupImageUrl.trim() !== '';
    const hadValidUrl = prevMockupUrlRef.current !== null;

    if (!hasValidUrl) {
      // Only clear if we had a valid URL before (not on initial mount or temporary null)
      if (hadValidUrl && appRef.current) {
        console.warn('RealisticWebGLPreview: mockupImageUrl became invalid, clearing scene');
        appRef.current.stage.removeChildren();
        sceneRef.current.garmentSprite = null;
        sceneRef.current.designSprite = null;
        sceneRef.current.displacementSprite = null;
        sceneRef.current.displacementFilter = null;
        sceneRef.current.mask = null;
        sceneRef.current.designContainer = null;
        sceneRef.current.placeholderContainer = null;
        prevMockupUrlRef.current = null;
      } else {
        // Just wait - don't clear anything if URL was never valid or is temporarily null
        console.warn('RealisticWebGLPreview: No valid mockupImageUrl provided (waiting):', mockupImageUrl);
      }
      return;
    }

    // Check if URL actually changed - if not, skip reloading
    if (prevMockupUrlRef.current === mockupImageUrl && sceneRef.current.garmentSprite) {
      // URL hasn't changed and we already have a garment sprite - just update physical dimensions if needed
      // This prevents unnecessary reloads when only physicalWidth/physicalHeight change
      return;
    }

    let cancelled = false;
    const currentApp = appRef.current;
    const currentUrl = mockupImageUrl;

    const run = async () => {
      try {
        console.log('RealisticWebGLPreview: Loading mockup image:', currentUrl);

        // Pre-validate image by loading it first
        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Image load timeout: ${currentUrl}`));
          }, 10000); // 10 second timeout

          img.onload = () => {
            clearTimeout(timeout);
            console.log('RealisticWebGLPreview: Image loaded successfully:', currentUrl, img.width, 'x', img.height);
            resolve();
          };
          img.onerror = (err) => {
            clearTimeout(timeout);
            console.error('RealisticWebGLPreview: Failed to load mockup image:', currentUrl, err);
            reject(new Error(`Failed to load image: ${currentUrl}`));
          };
          img.src = currentUrl;
        });

        if (cancelled) return;

        // Unload any previous texture for the old URL to avoid stale caches
        // Only unload if URL actually changed
        if (prevMockupUrlRef.current && prevMockupUrlRef.current !== currentUrl) {
          try {
            await Assets.unload(prevMockupUrlRef.current);
            console.log('RealisticWebGLPreview: Unloaded previous texture:', prevMockupUrlRef.current);
          } catch (e) {
            console.warn('RealisticWebGLPreview: Failed to unload previous texture:', e);
          }
        }

        // Now load as PixiJS texture
        console.log('RealisticWebGLPreview: Loading texture via PixiJS Assets...');
        const garmentTexture = await Assets.load(mockupImageUrl);
        if (cancelled) return;

        console.log('RealisticWebGLPreview: Texture loaded:', garmentTexture.width, 'x', garmentTexture.height);

        // Ensure we are still working with the same, live Application instance
        const app = appRef.current;
        if (!app || app !== currentApp) return;

        // Validate texture dimensions
        if (!garmentTexture || garmentTexture.width === 0 || garmentTexture.height === 0) {
          console.error('Invalid texture dimensions:', garmentTexture);
          return;
        }

        app.stage.removeChildren();

        // Reset displacement resources when URL changes
        sceneRef.current.displacementFilter = null;
        if (sceneRef.current.displacementSprite) {
          try { sceneRef.current.displacementSprite.destroy(); } catch { }
          sceneRef.current.displacementSprite = null;
        }

        const garmentSprite = new Sprite(garmentTexture);

        // Match CanvasMockup / DesignEditor layout: use inner effective area with padding
        const stageWidth = CANVAS_WIDTH;
        const stageHeight = CANVAS_HEIGHT;
        const maxWidth = stageWidth - CANVAS_PADDING * 2;
        const maxHeight = stageHeight - CANVAS_PADDING * 2;

        const aspectRatio = garmentTexture.width / garmentTexture.height;
        let width = maxWidth;
        let height = width / aspectRatio;
        if (height > maxHeight) {
          height = maxHeight;
          width = maxHeight * aspectRatio;
        }

        garmentSprite.width = width;
        garmentSprite.height = height;
        garmentSprite.x = CANVAS_PADDING + (maxWidth - width) / 2;
        garmentSprite.y = CANVAS_PADDING + (maxHeight - height) / 2;

        // Only apply garment tint if explicitly enabled
        // By default, use real per-color view images as-is without tinting
        if (enableGarmentTint && garmentTintHex) {
          const tint = hexToTint(garmentTintHex);
          if (tint !== null) {
            (garmentSprite as any).tint = tint;
          }
        } else {
          // Ensure neutral tint (white = no color modification)
          (garmentSprite as any).tint = 0xffffff;
        }

        // Background container to catch clicks on empty space
        const bgContainer = new Container();
        bgContainer.eventMode = 'static';
        bgContainer.hitArea = new Rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        bgContainer.on('pointerdown', (e) => {
          if (e.target === bgContainer && onSelectPlaceholder) {
            onSelectPlaceholder(null);
          }
        });

        bgContainer.addChild(garmentSprite);
        app.stage.addChild(bgContainer);

        // Estimate px per inch from physical dimensions if available
        let pxPerInch = 1;
        if (physicalWidth && physicalHeight && physicalWidth > 0 && physicalHeight > 0) {
          const scaleX = maxWidth / physicalWidth;
          const scaleY = maxHeight / physicalHeight;
          pxPerInch = Math.min(scaleX, scaleY);
        }

        sceneRef.current.garmentSprite = garmentSprite;
        sceneRef.current.designSprite = null;
        sceneRef.current.displacementSprite = null;
        sceneRef.current.displacementFilter = null;
        sceneRef.current.mask = null;

        // Root container for all design layers
        const designContainer = new Container();
        designContainer.sortableChildren = true;

        // Separate layers for placeholder designs and canvas elements
        const placeholderDesignLayer = new Container();
        placeholderDesignLayer.sortableChildren = true;
        placeholderDesignLayer.zIndex = 0; // Below canvas elements

        const canvasElementsLayer = new Container();
        canvasElementsLayer.sortableChildren = true;
        canvasElementsLayer.zIndex = 1; // Above placeholder designs

        designContainer.addChild(placeholderDesignLayer);
        designContainer.addChild(canvasElementsLayer);

        // Container for placeholders overlays (selection outlines)
        const placeholderContainer = new Container();

        app.stage.addChild(designContainer);
        app.stage.addChild(placeholderContainer);

        sceneRef.current.designContainer = designContainer;
        sceneRef.current.placeholderDesignLayer = placeholderDesignLayer;
        sceneRef.current.canvasElementsLayer = canvasElementsLayer;
        sceneRef.current.placeholderContainer = placeholderContainer;
        sceneRef.current.pxPerInch = pxPerInch;
        prevMockupUrlRef.current = currentUrl;

        // Signal that containers are ready so canvas elements effect can load
        setContainersReady(prev => prev + 1);

        if (DEBUG_LOGGING) {
          console.log('[RealisticWebGLPreview] Garment loaded, containers ready:', {
            currentView,
            garmentTintHex,
            mockupUrl: currentUrl?.slice(-20),
          });
        }
      } catch (error) {
        console.error('Error loading garment texture:', error);
        // Clear scene on error to prevent black texture
        if (appRef.current && appRef.current === currentApp) {
          appRef.current.stage.removeChildren();
          sceneRef.current.garmentSprite = null;
          sceneRef.current.designSprite = null;
          sceneRef.current.displacementSprite = null;
          sceneRef.current.displacementFilter = null;
          sceneRef.current.mask = null;
          sceneRef.current.designContainer = null;
          sceneRef.current.placeholderDesignLayer = null;
          sceneRef.current.canvasElementsLayer = null;
          sceneRef.current.placeholderContainer = null;
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      // Only unload if URL actually changed (not just because physicalWidth/physicalHeight changed)
      // We track this via prevMockupUrlRef, so we only unload in the async function above
      // This prevents race conditions where we unload a texture that's still being used
    };
  }, [appReady, mockupImageUrl, physicalWidth, physicalHeight]);

  // Apply garment tint only if explicitly enabled
  useEffect(() => {
    if (!appReady || !sceneRef.current.garmentSprite) return;
    const sprite = sceneRef.current.garmentSprite as any;

    // Only apply tint if enableGarmentTint is true
    if (enableGarmentTint && garmentTintHex) {
      const tint = hexToTint(garmentTintHex);
      if (tint !== null) {
        sprite.tint = tint;
      }
    } else {
      // Reset tint to neutral (white = no color modification)
      sprite.tint = 0xffffff;
    }
  }, [enableGarmentTint, garmentTintHex, appReady]);

  // Generate / update displacement map when garment or contrast changes
  useEffect(() => {
    if (!appReady || !appRef.current || !mockupImageUrl) return;

    const app = appRef.current;
    let cancelled = false;

    const generateMap = async () => {
      try {
        // Validate URL before generating displacement map
        if (!mockupImageUrl || typeof mockupImageUrl !== 'string' || mockupImageUrl.trim() === '') {
          console.error('Invalid mockupImageUrl for displacement map:', mockupImageUrl);
          return;
        }

        const dispTexture = await createDisplacementTextureFromGarment(
          mockupImageUrl,
          settings.contrastBoost,
        );
        if (cancelled) return;

        const garmentSprite = sceneRef.current.garmentSprite;
        if (!garmentSprite) return;

        // Create/Update Displacement Sprite
        // Clear existing filters so design sprites don't reference a soon-to-be-destroyed filter
        // Helper to clear filters from both layers
        const clearFiltersFromLayers = () => {
          if (sceneRef.current.placeholderDesignLayer) {
            sceneRef.current.placeholderDesignLayer.children.forEach((c: any) => {
              if (c && c instanceof Sprite && (c as any).filters) {
                (c as any).filters = null;
              }
            });
          }
          if (sceneRef.current.canvasElementsLayer) {
            sceneRef.current.canvasElementsLayer.children.forEach((c: any) => {
              if (c && c instanceof Sprite && (c as any).filters) {
                (c as any).filters = null;
              }
            });
          }
        };
        clearFiltersFromLayers();
        if (sceneRef.current.displacementSprite) {
          sceneRef.current.displacementSprite.destroy();
        }

        const dispSprite = new Sprite(dispTexture);
        // Match garment sprite transform so the displacement field aligns
        dispSprite.width = garmentSprite.width;
        dispSprite.height = garmentSprite.height;
        dispSprite.x = garmentSprite.x;
        dispSprite.y = garmentSprite.y;
        // Keep sprite in render tree as a lookup texture; invisible avoids black filter in Pixi v8
        dispSprite.visible = false;
        dispSprite.alpha = 0;
        app.stage.addChild(dispSprite);

        const filter = new DisplacementFilter({
          sprite: dispSprite,
          scale: {
            x: settings.scaleX,
            y: settings.scaleY,
          },
        });

        sceneRef.current.displacementSprite = dispSprite;
        sceneRef.current.displacementFilter = filter;

        // Helper to apply displacement filter to all sprites in both layers
        const applyFilterToLayers = (filter: DisplacementFilter) => {
          if (sceneRef.current.placeholderDesignLayer) {
            sceneRef.current.placeholderDesignLayer.children.forEach((c: any) => {
              if (c && c instanceof Sprite && c !== dispSprite) {
                (c as any).filters = [filter];
              }
            });
          }
          if (sceneRef.current.canvasElementsLayer) {
            sceneRef.current.canvasElementsLayer.children.forEach((c: any) => {
              if (c && c instanceof Sprite) {
                (c as any).filters = [filter];
              }
            });
          }
        };
        applyFilterToLayers(filter);

        // Bump token to notify other effects to re-bind if needed
        setFilterToken((t) => t + 1);
      } catch (error) {
        console.error('Error generating displacement map:', error);
      }
    };

    generateMap();

    return () => {
      cancelled = true;
    };
  }, [appReady, mockupImageUrl, settings.contrastBoost, settings.scaleX, settings.scaleY]);

  // Ensure designs always re-bind to the latest displacement filter
  useEffect(() => {
    const filter = sceneRef.current.displacementFilter;
    if (!filter) return;

    // Helper to apply filter to all sprites in both layers
    const applyFilterToLayers = () => {
      if (sceneRef.current.placeholderDesignLayer) {
        sceneRef.current.placeholderDesignLayer.children.forEach((c: any) => {
          if (c && c instanceof Sprite && c !== sceneRef.current.displacementSprite) {
            (c as any).filters = [filter];
          }
        });
      }
      if (sceneRef.current.canvasElementsLayer) {
        sceneRef.current.canvasElementsLayer.children.forEach((c: any) => {
          if (c && c instanceof Sprite) {
            (c as any).filters = [filter];
          }
        });
      }
    };
    applyFilterToLayers();
  }, [filterToken]);

  // Update filter scale when sliders move
  useEffect(() => {
    const filter = sceneRef.current.displacementFilter;
    if (filter && filter.scale) {
      // PixiJS v8: scale can be a Point object with .set() or an object with x/y properties
      if (typeof filter.scale.set === 'function') {
        filter.scale.set(settings.scaleX, settings.scaleY);
      } else {
        // Fallback: direct property assignment
        filter.scale.x = settings.scaleX;
        filter.scale.y = settings.scaleY;
      }
    }
  }, [settings.scaleX, settings.scaleY]);

  // Render Placeholder Outlines and Interactions (hidden in preview mode)
  useEffect(() => {
    if (!appReady || !appRef.current || !sceneRef.current.placeholderContainer || !sceneRef.current.garmentSprite) {
      console.log('RealisticWebGLPreview: Skipping placeholder render - not ready', {
        appReady,
        hasApp: !!appRef.current,
        hasContainer: !!sceneRef.current.placeholderContainer,
        hasGarment: !!sceneRef.current.garmentSprite,
      });
      return;
    }

    const container = sceneRef.current.placeholderContainer;
    container.removeChildren();

    // Hide placeholders in preview mode
    if (previewMode) {
      console.log('RealisticWebGLPreview: Preview mode active - hiding placeholders');
      return;
    }

    console.log('RealisticWebGLPreview: Rendering placeholders', {
      count: placeholders.length,
      previewMode,
      placeholders: placeholders.map(p => ({ id: p.id, xIn: p.xIn, yIn: p.yIn })),
    });

    const pxPerInch = sceneRef.current.pxPerInch || 1;

    if (placeholders.length === 0) {
      console.log('RealisticWebGLPreview: No placeholders to render');
      return;
    }

    placeholders.forEach((placeholder) => {
      const isSelected = activePlaceholder && activePlaceholder.id === placeholder.id;
      const graphics = new Graphics();

      const isPolygon =
        placeholder.shapeType === 'polygon' &&
        placeholder.polygonPoints &&
        placeholder.polygonPoints.length >= 3;

      let phScreenX: number;
      let phScreenY: number;
      let phScreenW: number;
      let phScreenH: number;
      let polygonPointsPx: { x: number; y: number }[] | null = null;

      const fillColor = isSelected ? 0xfbcfe8 : 0xfbcfe8;
      const fillAlpha = 0.2; // Increase visibility
      const strokeColor = isSelected ? 0xdb2777 : 0xf472b6;
      const strokeWidth = 1;
      const strokeAlpha = 1;

      if (isPolygon) {
        polygonPointsPx = placeholder.polygonPoints!.map((pt) => ({
          x: CANVAS_PADDING + pt.xIn * pxPerInch,
          y: CANVAS_PADDING + pt.yIn * pxPerInch,
        }));

        graphics.beginPath();
        const [first, ...rest] = polygonPointsPx;
        graphics.moveTo(first.x, first.y);
        rest.forEach(p => graphics.lineTo(p.x, p.y));
        graphics.closePath();
        graphics.fill({ color: fillColor, alpha: fillAlpha });
        graphics.stroke({ color: strokeColor, width: strokeWidth, alpha: strokeAlpha });

        // Calculate bounds for hit area
        const xs = polygonPointsPx.map(p => p.x);
        const ys = polygonPointsPx.map(p => p.y);
        phScreenX = Math.min(...xs);
        phScreenY = Math.min(...ys);
        phScreenW = Math.max(...xs) - phScreenX;
        phScreenH = Math.max(...ys) - phScreenY;

      } else {
        phScreenX = CANVAS_PADDING + placeholder.xIn * pxPerInch;
        phScreenY = CANVAS_PADDING + placeholder.yIn * pxPerInch;
        phScreenW = placeholder.widthIn * pxPerInch;
        phScreenH = placeholder.heightIn * pxPerInch;

        graphics.rect(phScreenX, phScreenY, phScreenW, phScreenH);
        graphics.fill({ color: fillColor, alpha: fillAlpha });
        graphics.stroke({ color: strokeColor, width: strokeWidth, alpha: strokeAlpha });
      }

      graphics.eventMode = 'static';
      graphics.cursor = 'pointer';

      // Handle click for selection
      graphics.on('pointerdown', (e) => {
        e.stopPropagation(); // Stop propagation to bg
        console.log('Clicked placeholder:', placeholder.id);
        if (onSelectPlaceholder) {
          onSelectPlaceholder(placeholder.id);
          // Force re-render of this effect by updating activePlaceholder via parent
        }
      });

      container.addChild(graphics);
    });

  }, [appReady, placeholders, activePlaceholder, onSelectPlaceholder, previewMode]);


  // Load and place designs into all placeholders that have sample designs.
  // Designs can be dragged within their placeholder bounds but cannot exceed them.
  useEffect(() => {
    if (
      !appReady ||
      !appRef.current ||
      !mockupImageUrl ||
      !sceneRef.current.garmentSprite ||
      !sceneRef.current.placeholderDesignLayer
    ) {
      return;
    }

    let cancelled = false;

    const loadDesigns = async () => {
      const container = sceneRef.current.placeholderDesignLayer!;

      // Clear only placeholder design layer (never touch canvas elements layer)
      container.removeChildren();

      if (DEBUG_LOGGING) {
        console.log('[RealisticWebGLPreview] Loading placeholder designs:', {
          currentView,
          garmentTintHex,
          placeholdersCount: placeholders.length
        });
      }

      const pxPerInch = sceneRef.current.pxPerInch || 1;

      // Reset metrics; they will be recomputed for the active placeholder
      setActiveDesignMetrics(null);

      // Use externalDesignUrls directly to ensure we get the latest values
      const currentDesignUrls = Object.keys(externalDesignUrls).length > 0
        ? externalDesignUrls
        : internalDesignUrls;

      for (const placeholder of placeholders) {
        if (cancelled) return;

        const designUrl = currentDesignUrls[placeholder.id];
        if (!designUrl) continue;

        const designTex = await Assets.load(designUrl);
        if (cancelled) return;

        const designSprite = new Sprite(designTex);

        // Determine placeholder bounds in screen pixels.
        const isPolygon =
          placeholder.shapeType === 'polygon' &&
          placeholder.polygonPoints &&
          placeholder.polygonPoints.length >= 3;

        let phScreenX: number;
        let phScreenY: number;
        let phScreenW: number;
        let phScreenH: number;
        let polygonPointsPx: { x: number; y: number }[] | null = null;

        if (isPolygon) {
          // Convert polygon points from inches to pixels using same mapping as CanvasMockup / DesignEditor.
          polygonPointsPx = placeholder.polygonPoints!.map((pt) => ({
            x: CANVAS_PADDING + pt.xIn * pxPerInch,
            y: CANVAS_PADDING + pt.yIn * pxPerInch,
          }));

          const xs = polygonPointsPx.map((p) => p.x);
          const ys = polygonPointsPx.map((p) => p.y);
          const minX = Math.min(...xs);
          const maxX = Math.max(...xs);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);

          phScreenX = minX;
          phScreenY = minY;
          phScreenW = maxX - minX;
          phScreenH = maxY - minY;
        } else {
          // Rectangular placeholder: direct inches -> pixels.
          phScreenX = CANVAS_PADDING + placeholder.xIn * pxPerInch;
          phScreenY = CANVAS_PADDING + placeholder.yIn * pxPerInch;
          phScreenW = placeholder.widthIn * pxPerInch;
          phScreenH = placeholder.heightIn * pxPerInch;
        }

        // Scale design to fit inside placeholder bounds while preserving aspect ratio.
        const initialScale = Math.min(phScreenW / designTex.width, phScreenH / designTex.height);
        designSprite.scale.set(initialScale);
        designSprite.anchor.set(0.5);
        designSprite.x = phScreenX + phScreenW / 2;
        designSprite.y = phScreenY + phScreenH / 2;

        // SAFE blend mode: checks if garment background exists to prevent black designs
        // Without background, multiply/screen causes black/invisible rendering
        const hasGarmentBackground = !!sceneRef.current.garmentSprite;
        const safeBlendMode = getSafeBlendMode(garmentTintHex, hasGarmentBackground);
        designSprite.blendMode = safeBlendMode as any;
        designSprite.alpha = hasGarmentBackground ? REALISM_ALPHA : 1.0; // Full alpha if no background

        // Build mask matching placeholder shape.
        const mask = new Graphics();
        if (isPolygon && polygonPointsPx && polygonPointsPx.length >= 3) {
          // Polygon mask for magnetic lasso placeholder.
          const [first, ...rest] = polygonPointsPx;
          mask.moveTo(first.x, first.y);
          for (const p of rest) {
            mask.lineTo(p.x, p.y);
          }
          mask.closePath();
          mask.fill({ color: 0xffffff });
        } else {
          // Simple rectangular mask.
          mask.rect(phScreenX, phScreenY, phScreenW, phScreenH);
          mask.fill({ color: 0xffffff });
        }

        // Add to placeholder design layer
        container.addChild(mask);
        container.addChild(designSprite);
        designSprite.mask = mask;
        designSprite.zIndex = 0;

        // Apply displacement filter for fabric warping effect
        if (sceneRef.current.displacementFilter) {
          designSprite.filters = [sceneRef.current.displacementFilter];
        }

        const updateMetrics = () => {
          if (!activePlaceholder || placeholder.id !== activePlaceholder.id) return;

          const designWidthPx = designTex.width * designSprite.scale.x;
          const designHeightPx = designTex.height * designSprite.scale.y;

          const xIn =
            (designSprite.x - CANVAS_PADDING - designWidthPx / 2) / pxPerInch;
          const yIn =
            (designSprite.y - CANVAS_PADDING - designHeightPx / 2) / pxPerInch;
          const widthIn = designWidthPx / pxPerInch;
          const heightIn = designHeightPx / pxPerInch;

          setActiveDesignMetrics({
            xIn,
            yIn,
            widthIn,
            heightIn,
          });
        };

        // Initialize metrics for this placeholder if it's the active one
        updateMetrics();

        // Enable interactions only in edit mode (when previewMode is false)
        if (!previewMode) {
          designSprite.eventMode = 'static';
          designSprite.cursor = 'move';

          let isDragging = false;
          let dragOffsetX = 0;
          let dragOffsetY = 0;

          const getClampedPosition = (rawX: number, rawY: number, scale: number) => {
            const halfW = (designTex.width * scale) / 2;
            const halfH = (designTex.height * scale) / 2;

            const minX = phScreenX + halfW;
            const maxX = phScreenX + phScreenW - halfW;
            const minY = phScreenY + halfH;
            const maxY = phScreenY + phScreenH - halfH;

            const x = Math.min(maxX, Math.max(minX, rawX));
            const y = Math.min(maxY, Math.max(minY, rawY));

            return { x, y };
          };

          designSprite.on('pointerdown', (event) => {
            isDragging = true;
            const globalPos = event.global;
            dragOffsetX = globalPos.x - designSprite.x;
            dragOffsetY = globalPos.y - designSprite.y;

            // Also select the placeholder when clicking its design
            if (onSelectPlaceholder) {
              onSelectPlaceholder(placeholder.id);
            }
            event.stopPropagation();
          });

          designSprite.on('pointerup', () => {
            isDragging = false;
          });

          designSprite.on('pointerupoutside', () => {
            isDragging = false;
          });

          designSprite.on('pointermove', (event) => {
            if (!isDragging) return;
            const globalPos = event.global;
            const targetX = globalPos.x - dragOffsetX;
            const targetY = globalPos.y - dragOffsetY;
            const { x, y } = getClampedPosition(targetX, targetY, designSprite.scale.x);
            designSprite.x = x;
            designSprite.y = y;
            updateMetrics();
          });

          // Resize via mouse wheel while keeping within placeholder bounds
          designSprite.on('wheel', (event) => {
            const delta = event.deltaY;
            if (!delta) return;

            const scaleFactor = 1 - delta * 0.001; // subtle zoom
            const currentScale = designSprite.scale.x;
            let newScale = currentScale * scaleFactor;

            const minScale = 0.1;
            const maxScale = 3;
            newScale = Math.max(minScale, Math.min(maxScale, newScale));

            // Clamp position so resized sprite stays fully inside placeholder
            const { x, y } = getClampedPosition(designSprite.x, designSprite.y, newScale);
            designSprite.scale.set(newScale);
            designSprite.x = x;
            designSprite.y = y;
            updateMetrics();
          });
        } else {
          // Preview mode: disable interactions
          designSprite.eventMode = 'none';
          (designSprite as any).cursor = 'default';
        }
      }

      // Sort placeholder designs by zIndex (though they typically all have zIndex 0)
      container.children.sort((a, b) => {
        const aZ = (a as any).zIndex || 0;
        const bZ = (b as any).zIndex || 0;
        return aZ - bZ;
      });

      if (DEBUG_LOGGING) {
        console.log('[RealisticWebGLPreview] Placeholder designs loaded:', {
          currentView,
          garmentTintHex,
          placeholderDesignLayerSprites: container.children.length,
          canvasElementsLayerSprites: sceneRef.current.canvasElementsLayer?.children.length || 0
        });
      }
    };

    loadDesigns();

    return () => {
      cancelled = true;
    };
  }, [appReady, externalDesignUrls, placeholders, mockupImageUrl, activePlaceholder, filterToken, onSelectPlaceholder, previewMode, garmentTintHex, currentView]);

  // Garment tint changes are already handled by the design loading effect
  // No additional blend mode updates needed with soft-light approach
  // (The effect was needed for the two-layer system which is now removed)

  // Toggle interaction mode on existing design sprites when previewMode changes
  useEffect(() => {
    if (!appReady) return;

    const updateInteractions = (c: any) => {
      if (previewMode) {
        c.eventMode = 'none';
        try { c.cursor = 'default'; } catch { }
        if (typeof c.removeAllListeners === 'function') {
          c.removeAllListeners();
        }
      } else {
        c.eventMode = 'static';
        try { c.cursor = 'move'; } catch { }
      }
    };

    // Only update placeholder design sprites (canvas elements don't need interaction)
    if (sceneRef.current.placeholderDesignLayer) {
      sceneRef.current.placeholderDesignLayer.children.forEach(updateInteractions);
    }
  }, [previewMode, appReady]);

  // Render canvas elements (images added via graphics tab)
  useEffect(() => {
    if (DEBUG_LOGGING) {
      console.log('[RealisticWebGLPreview] Canvas elements effect triggered:', {
        currentView,
        garmentTintHex,
        containersReady,
        appReady,
        hasApp: !!appRef.current,
        mockupImageUrl: mockupImageUrl?.slice(-20),
        hasGarmentSprite: !!sceneRef.current.garmentSprite,
        hasCanvasElementsLayer: !!sceneRef.current.canvasElementsLayer,
        totalCanvasElements: canvasElements.length,
        canvasElementsByView: canvasElements.reduce((acc, el) => {
          const view = el.view || 'no-view';
          acc[view] = (acc[view] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      });
    }

    if (
      !appReady ||
      !appRef.current ||
      !mockupImageUrl ||
      !sceneRef.current.garmentSprite ||
      !sceneRef.current.canvasElementsLayer
    ) {
      if (DEBUG_LOGGING) {
        console.log('[RealisticWebGLPreview] Canvas elements effect: early return - containers not ready');
      }
      return;
    }

    let cancelled = false;

    const loadCanvasElements = async () => {
      // Normalize view matching: case-insensitive and handle !el.view as "all views"
      const normalizedCurrentView = currentView?.toLowerCase() || '';

      // Filter canvas elements for current view and visible image elements
      const imageElements = canvasElements.filter(
        (el) => {
          if (el.type !== 'image' || !el.imageUrl || el.visible === false) return false;

          // Normalize element view for comparison
          const elView = el.view?.toLowerCase() || '';

          // Match if: no view (appears on all), or view matches (case-insensitive)
          return !el.view || elView === normalizedCurrentView;
        }
      );

      const container = sceneRef.current.canvasElementsLayer!;
      const canvasSprites = sceneRef.current.canvasElementSprites;

      if (DEBUG_LOGGING) {
        console.log('[RealisticWebGLPreview] Loading canvas elements:', {
          currentView,
          normalizedCurrentView,
          garmentTintHex,
          totalElements: canvasElements.length,
          filteredElements: imageElements.length
        });
      }

      // Remove sprites for elements that no longer exist or changed
      // Only remove from canvas elements layer (never touch placeholder design layer)
      const currentElementIds = new Set(imageElements.map((el) => el.id));
      for (const [elementId, sprite] of canvasSprites.entries()) {
        if (!currentElementIds.has(elementId)) {
          try {
            container.removeChild(sprite);
            sprite.destroy();
            canvasSprites.delete(elementId);
          } catch (e) {
            // Ignore errors during cleanup
          }
        }
      }

      if (imageElements.length === 0) {
        return;
      }

      // Get garment sprite position for relative positioning
      const garmentSprite = sceneRef.current.garmentSprite;
      if (!garmentSprite) {
        return;
      }

      // Load and render each canvas image element
      for (const element of imageElements) {
        if (cancelled) return;
        if (!element.imageUrl) continue;

        // Skip if sprite already exists and update it
        if (canvasSprites.has(element.id)) {
          const existingSprite = canvasSprites.get(element.id)!;

          // Ensure anchor is set to center (in case it wasn't set before)
          if (existingSprite.anchor.x !== 0.5 || existingSprite.anchor.y !== 0.5) {
            existingSprite.anchor.set(0.5, 0.5);
          }

          // Update size first
          if (element.width && element.height) {
            existingSprite.width = element.width;
            existingSprite.height = element.height;
          }

          // Update position - adjust for centered anchor
          const spriteWidth = existingSprite.width;
          const spriteHeight = existingSprite.height;
          existingSprite.x = element.x + spriteWidth / 2;
          existingSprite.y = element.y + spriteHeight / 2;

          // Update rotation
          if (element.rotation !== undefined) {
            existingSprite.rotation = (element.rotation * Math.PI) / 180;
          }

          // Update opacity
          existingSprite.alpha = element.opacity !== undefined ? element.opacity : 1;

          // Update flip - with centered anchor, this will flip around center without moving
          if (element.flipX) {
            existingSprite.scale.x = Math.abs(existingSprite.scale.x) * -1;
          } else {
            existingSprite.scale.x = Math.abs(existingSprite.scale.x);
          }
          if (element.flipY) {
            existingSprite.scale.y = Math.abs(existingSprite.scale.y) * -1;
          } else {
            existingSprite.scale.y = Math.abs(existingSprite.scale.y);
          }
          continue;
        }

        try {
          const texture = await Assets.load(element.imageUrl);
          if (cancelled) return;

          const sprite = new Sprite(texture);

          // Set size first (needed for anchor calculation)
          if (element.width && element.height) {
            sprite.width = element.width;
            sprite.height = element.height;
          } else if (texture.width && texture.height) {
            sprite.width = texture.width;
            sprite.height = texture.height;
          }

          // Set anchor to center (0.5, 0.5) so flipping happens around center
          sprite.anchor.set(0.5, 0.5);

          // Set position - adjust for centered anchor
          // element.x and element.y are top-left, but with centered anchor we need center position
          const spriteWidth = sprite.width;
          const spriteHeight = sprite.height;
          sprite.x = element.x + spriteWidth / 2;
          sprite.y = element.y + spriteHeight / 2;

          // Apply rotation
          if (element.rotation !== undefined) {
            sprite.rotation = (element.rotation * Math.PI) / 180;
          }

          // Apply flip - with centered anchor, this will flip around center without moving
          if (element.flipX) {
            sprite.scale.x = -Math.abs(sprite.scale.x);
          } else {
            sprite.scale.x = Math.abs(sprite.scale.x);
          }
          if (element.flipY) {
            sprite.scale.y = -Math.abs(sprite.scale.y);
          } else {
            sprite.scale.y = Math.abs(sprite.scale.y);
          }
          // SAFE blend mode for canvas elements - same logic as placeholder designs
          const hasGarmentBackground = !!sceneRef.current.garmentSprite;

          // Apply opacity with appropriate alpha
          if (element.blendMode) {
            // Explicit blend mode - use full alpha
            sprite.blendMode = element.blendMode as any;
            sprite.alpha = element.opacity !== undefined ? element.opacity : 1;
          } else {
            // Auto blend mode - use safe blend with realism alpha
            const safeBlendMode = getSafeBlendMode(garmentTintHex, hasGarmentBackground);
            sprite.blendMode = safeBlendMode as any;
            sprite.alpha = hasGarmentBackground
              ? (element.opacity !== undefined ? element.opacity * REALISM_ALPHA : REALISM_ALPHA)
              : (element.opacity !== undefined ? element.opacity : 1);
          }

          // Apply displacement filter for fabric warping effect
          if (sceneRef.current.displacementFilter) {
            sprite.filters = [sceneRef.current.displacementFilter];
          }

          // Set z-index (PixiJS uses zIndex property) - ensure canvas elements are above placeholder designs
          sprite.zIndex = (element.zIndex || 0) + 1000; // Offset to ensure above placeholder designs

          // Store reference to this sprite
          canvasSprites.set(element.id, sprite);
          container.addChild(sprite);
        } catch (error) {
          if (!cancelled) {
            console.error(`Failed to load canvas element image: ${element.imageUrl}`, error);
          }
        }
      }

      // Sort children by zIndex within canvas elements layer
      container.children.sort((a, b) => {
        const aZ = (a as any).zIndex || 0;
        const bZ = (b as any).zIndex || 0;
        return aZ - bZ;
      });

      if (DEBUG_LOGGING) {
        console.log('[RealisticWebGLPreview] Canvas elements loaded:', {
          currentView,
          garmentTintHex,
          placeholderDesignLayerSprites: sceneRef.current.placeholderDesignLayer?.children.length || 0,
          canvasElementsLayerSprites: container.children.length
        });
      }
    };

    loadCanvasElements();

    // Cleanup function - cancel async operations and clear only canvas elements layer
    return () => {
      cancelled = true;
      if (sceneRef.current.canvasElementsLayer && sceneRef.current.canvasElementSprites) {
        const container = sceneRef.current.canvasElementsLayer!;
        const canvasSprites = sceneRef.current.canvasElementSprites;
        for (const [elementId, sprite] of canvasSprites.entries()) {
          try {
            container.removeChild(sprite);
            sprite.destroy();
          } catch (e) {
            // Ignore errors during cleanup
          }
        }
        canvasSprites.clear();
      }
    };
  }, [
    appReady,
    mockupImageUrl,
    canvasElements,
    currentView,
    garmentTintHex,
    filterToken, // Re-apply filters when displacement changes
    containersReady, // Re-run when containers are set up after garment loading
  ]);

  // Handle design upload via callback if provided, otherwise use internal state
  const handleDesignUpload = (placeholderId: string, designUrl: string) => {
    if (onDesignUpload) {
      onDesignUpload(placeholderId, designUrl);
    } else {
      setInternalDesignUrls((prev) => ({
        ...prev,
        [placeholderId]: designUrl,
      }));
    }
  };

  // Expose design transform and bounds for overlay integration
  useEffect(() => {
    if (onDesignTransformChange && activePlaceholder) {
      const placeholderId = activePlaceholder.id;
      const designSprite = sceneRef.current.designSprite;
      if (designSprite) {
        const pxPerInch = sceneRef.current.pxPerInch || 1;
        const designWidthPx = designSprite.width * designSprite.scale.x;
        const designHeightPx = designSprite.height * designSprite.scale.y;

        const xIn = (designSprite.x - CANVAS_PADDING - designWidthPx / 2) / pxPerInch;
        const yIn = (designSprite.y - CANVAS_PADDING - designHeightPx / 2) / pxPerInch;
        const scale = designSprite.scale.x;

        onDesignTransformChange(placeholderId, { x: xIn, y: yIn, scale });
      }
    }
  }, [activePlaceholder, onDesignTransformChange, activeDesignMetrics]);

  // Pure canvas renderer - no UI panels
  return (
    <div ref={containerRef} style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} />
  );
};


