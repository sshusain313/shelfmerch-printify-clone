import React, { useEffect, useRef, useState } from 'react';
import { Application, Assets, Container, DisplacementFilter, Graphics, Rectangle, Sprite } from 'pixi.js';
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
    designContainer: Container | null;
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
    placeholderContainer: null,
    pxPerInch: 1,
    canvasElementSprites: new Map(),
  });

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
    // Validate mockupImageUrl before proceeding
    if (!mockupImageUrl || typeof mockupImageUrl !== 'string' || mockupImageUrl.trim() === '') {
      console.warn('RealisticWebGLPreview: No valid mockupImageUrl provided:', mockupImageUrl);
      // Clear scene if no mockup image
      if (appRef.current) {
        appRef.current.stage.removeChildren();
        sceneRef.current.garmentSprite = null;
        sceneRef.current.designSprite = null;
        sceneRef.current.displacementSprite = null;
        sceneRef.current.displacementFilter = null;
        sceneRef.current.mask = null;
        sceneRef.current.designContainer = null;
        sceneRef.current.placeholderContainer = null;
      }
      return;
    }

    if (!appReady || !appRef.current) return;

    let cancelled = false;
    const currentApp = appRef.current;
    const prevUrlRef: { current?: string } = { current: undefined };

    const run = async () => {
      try {
        console.log('RealisticWebGLPreview: Loading mockup image:', mockupImageUrl);

        // Pre-validate image by loading it first
        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Image load timeout: ${mockupImageUrl}`));
          }, 10000); // 10 second timeout

          img.onload = () => {
            clearTimeout(timeout);
            console.log('RealisticWebGLPreview: Image loaded successfully:', mockupImageUrl, img.width, 'x', img.height);
            resolve();
          };
          img.onerror = (err) => {
            clearTimeout(timeout);
            console.error('RealisticWebGLPreview: Failed to load mockup image:', mockupImageUrl, err);
            reject(new Error(`Failed to load image: ${mockupImageUrl}`));
          };
          img.src = mockupImageUrl;
        });

        if (cancelled) return;

        // Unload any previous texture for the old URL to avoid stale caches
        if (prevUrlRef.current && prevUrlRef.current !== mockupImageUrl) {
          try { await Assets.unload(prevUrlRef.current as string); } catch { }
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

        if (garmentTintHex) {
          const tint = hexToTint(garmentTintHex);
          if (tint !== null) {
            (garmentSprite as any).tint = tint;
          }
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

        const designContainer = new Container();
        // Container for placeholders overlays (selection outlines)
        const placeholderContainer = new Container();

        app.stage.addChild(designContainer);
        app.stage.addChild(placeholderContainer);

        sceneRef.current.designContainer = designContainer;
        sceneRef.current.placeholderContainer = placeholderContainer;
        sceneRef.current.pxPerInch = pxPerInch;
        prevUrlRef.current = mockupImageUrl;
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
          sceneRef.current.placeholderContainer = null;
        }
      }
    };

    run();

    return () => {
      cancelled = true;
      // Attempt to unload when effect re-runs for a different URL
      if (mockupImageUrl) {
        Assets.unload(mockupImageUrl).catch(() => { });
      }
    };
  }, [appReady, mockupImageUrl, physicalWidth, physicalHeight]);

  useEffect(() => {
    if (!appReady || !sceneRef.current.garmentSprite) return;
    const sprite = sceneRef.current.garmentSprite as any;
    if (garmentTintHex) {
      const tint = hexToTint(garmentTintHex);
      if (tint !== null) {
        sprite.tint = tint;
      }
    } else {
      // Reset tint to default (white = no tint)
      sprite.tint = 0xffffff;
    }
  }, [garmentTintHex, appReady]);

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
        if (sceneRef.current.designContainer) {
          sceneRef.current.designContainer.children.forEach((c: any) => {
            if (c && (c as any).filters) (c as any).filters = null;
          });
        }
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

        // Re-attach filter to all design sprites
        if (sceneRef.current.designContainer) {
          sceneRef.current.designContainer.children.forEach((c: any) => {
            if (c && c !== dispSprite) (c as any).filters = [filter];
          });
        }

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
    const container = sceneRef.current.designContainer;
    if (!filter || !container) return;
    container.children.forEach((c: any) => {
      if (c && c !== sceneRef.current.displacementSprite) (c as any).filters = [filter];
    });
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
      !sceneRef.current.designContainer
    ) {
      return;
    }

    const loadDesigns = async () => {
      const container = sceneRef.current.designContainer!;
      // Remove only placeholder design sprites (those with masks), preserve canvas elements
      const canvasSprites = sceneRef.current.canvasElementSprites;
      const canvasSpriteSet = new Set(canvasSprites.values());
      const toRemove: any[] = [];
      container.children.forEach((child) => {
        if (!canvasSpriteSet.has(child as Sprite)) {
          toRemove.push(child);
        }
      });
      toRemove.forEach((child) => {
        try {
          container.removeChild(child);
          if ((child as any).destroy) {
            (child as any).destroy();
          }
        } catch (e) {
          // Ignore errors
        }
      });

      const pxPerInch = sceneRef.current.pxPerInch || 1;

      // Reset metrics; they will be recomputed for the active placeholder
      setActiveDesignMetrics(null);

      // Use externalDesignUrls directly to ensure we get the latest values
      const currentDesignUrls = Object.keys(externalDesignUrls).length > 0
        ? externalDesignUrls
        : internalDesignUrls;

      for (const placeholder of placeholders) {
        const designUrl = currentDesignUrls[placeholder.id];
        if (!designUrl) continue;

        const designTex = await Assets.load(designUrl);
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

        // Dynamic blend mode based on garment color luminance
        // For dark garments: use 'screen' blend mode with full opacity to brighten the design
        // For light garments: use 'multiply' blend mode to integrate naturally with garment color
        // if (garmentTintHex) {
        //   const isDark = isDarkHex(garmentTintHex);
        //   designSprite.blendMode = isDark ? 'screen' : 'multiply';
        //   designSprite.alpha = isDark ? 1.0 : 0.9; // Full opacity for dark garments, slightly reduced for light
        // } else {
        //   // Default: use multiply for untinted garments (assumed light/white)
        //   designSprite.blendMode = 'multiply';
        //   designSprite.alpha = 0.9;
        // }

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

        container.addChild(mask);
        container.addChild(designSprite);
        designSprite.mask = mask;

        // Apply displacement if available.
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
    };

    loadDesigns();
  }, [appReady, externalDesignUrls, placeholders, mockupImageUrl, activePlaceholder, filterToken, onSelectPlaceholder, previewMode, garmentTintHex]);

  // Update blend mode and opacity of existing design sprites when garment color changes
  useEffect(() => {
    const container = sceneRef.current.designContainer;
    if (!appReady || !container) return;

    // Update blend mode and opacity for all design sprites based on garment color
    container.children.forEach((child: any) => {
      // Skip non-sprite children (like masks)
      if (!(child instanceof Sprite)) return;
      // Skip the displacement sprite if it exists
      if (child === sceneRef.current.displacementSprite) return;

      // Apply dynamic blend mode based on garment color luminance
      if (garmentTintHex) {
        const isDark = isDarkHex(garmentTintHex);
        child.blendMode = isDark ? 'screen' : 'multiply';
        child.alpha = isDark ? 1.0 : 0.9;
      } else {
        // Default: use multiply for untinted garments
        child.blendMode = 'multiply';
        child.alpha = 0.9;
      }
    });
  }, [appReady, garmentTintHex]);

  // Toggle interaction mode on existing design sprites when previewMode changes
  useEffect(() => {
    const container = sceneRef.current.designContainer;
    if (!appReady || !container) return;
    container.children.forEach((c: any) => {
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
    });
  }, [previewMode, appReady]);

  // Render canvas elements (images added via graphics tab)
  useEffect(() => {
    if (
      !appReady ||
      !appRef.current ||
      !mockupImageUrl ||
      !sceneRef.current.garmentSprite ||
      !sceneRef.current.designContainer
    ) {
      return;
    }

    const loadCanvasElements = async () => {
      // Filter canvas elements for current view and visible image elements
      const imageElements = canvasElements.filter(
        (el) =>
          el.type === 'image' &&
          el.imageUrl &&
          (el.view === currentView || !el.view) &&
          el.visible !== false
      );

      const container = sceneRef.current.designContainer!;
      const canvasSprites = sceneRef.current.canvasElementSprites;

      // Remove sprites for elements that no longer exist or changed
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

          // Apply opacity
          sprite.alpha = element.opacity !== undefined ? element.opacity : 1;

          // Apply blend mode
          if (element.blendMode) {
            sprite.blendMode = element.blendMode as any;
          } else if (garmentTintHex) {
            // Use same logic as placeholder designs
            const isDark = isDarkHex(garmentTintHex);
            sprite.blendMode = isDark ? 'screen' : 'multiply';
            sprite.alpha = isDark ? 1.0 : 0.9;
          } else {
            sprite.blendMode = 'multiply';
            sprite.alpha = 0.9;
          }

          // Apply displacement filter if available
          if (sceneRef.current.displacementFilter) {
            sprite.filters = [sceneRef.current.displacementFilter];
          }

          // Set z-index (PixiJS uses zIndex property)
          sprite.zIndex = element.zIndex || 0;

          // Store reference to this sprite
          canvasSprites.set(element.id, sprite);
          container.addChild(sprite);
        } catch (error) {
          console.error(`Failed to load canvas element image: ${element.imageUrl}`, error);
        }
      }

      // Sort children by zIndex
      container.children.sort((a, b) => {
        const aZ = (a as any).zIndex || 0;
        const bZ = (b as any).zIndex || 0;
        return aZ - bZ;
      });
    };

    loadCanvasElements();

    // Cleanup function - remove all canvas element sprites when dependencies change
    return () => {
      if (sceneRef.current.designContainer && sceneRef.current.canvasElementSprites) {
        const container = sceneRef.current.designContainer!;
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


