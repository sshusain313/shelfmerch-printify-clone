import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { storeProductsApi, productApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, ArrowLeft, Image as ImageIcon, Save, Check, Loader2 } from 'lucide-react';
import { RealisticWebGLPreview } from '@/components/admin/RealisticWebGLPreview';
import type { DisplacementSettings } from '@/types/product';
import { toast } from 'sonner';
import { RAW_API_URL } from '@/config';

interface LocationState {
    storeProductId?: string;
    productId?: string;
    title?: string;
    selectedColors?: string[];
    selectedSizes?: string[];
    primaryColorHex?: string | null;
}

const MockupsLibrary = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state || {}) as LocationState;

    const [storeProductId] = useState<string | undefined>(state.storeProductId);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [storeProduct, setStoreProduct] = useState<any | null>(null);
    const [sampleMockups, setSampleMockups] = useState<any[]>([]);
    const [variants, setVariants] = useState<any[]>([]); // Store full variants data
    const [isLoadingMockups, setIsLoadingMockups] = useState(false);
    const [catalogPhysicalDimensions, setCatalogPhysicalDimensions] = useState<{ width: number; height: number } | null>(null);

    // Preview generation state
    const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
    const [generatingMap, setGeneratingMap] = useState<Record<string, boolean>>({});
    const previewCache = useRef<Record<string, string>>({});

    // WebGL preview state
    // Higher displacement values for lifestyle mockups where garments are smaller in frame
    const defaultDisplacementSettings: DisplacementSettings = {
        scaleX: 45,
        scaleY: 45,
        contrastBoost: 2.0,
    };
    const [displacementSettings, setDisplacementSettings] = useState<DisplacementSettings>(defaultDisplacementSettings);
    const webglContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [savedMockupUrls, setSavedMockupUrls] = useState<Record<string, string>>({});
    const [savingMockups, setSavingMockups] = useState<Record<string, boolean>>({});
    const [allSaved, setAllSaved] = useState(false);
    const [isSavingAll, setIsSavingAll] = useState(false);
    const [hasAutoSaved, setHasAutoSaved] = useState(false);

    // Track which mockups have WebGL ready
    const [webglReadyMap, setWebglReadyMap] = useState<Record<string, boolean>>({});

    // Selected colors and sizes from DesignEditor
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedSizesByColor, setSelectedSizesByColor] = useState<Record<string, string[]>>({});
    const [primaryColorHex, setPrimaryColorHex] = useState<string | null>(null);

    // Available colors from catalog product
    const [availableColors, setAvailableColors] = useState<string[]>([]);

    // Currently selected color for preview (defaults to first selected color)
    const [currentPreviewColor, setCurrentPreviewColor] = useState<string | null>(null);

    // Convert placeholder inches to pixels based on mockup image dimensions
    // This exactly replicates the coordinate system used in CanvasMockup.tsx:
    // - 800x600 canvas with 40px padding
    // - Mockup image scaled to fit and centered within effective area
    // - Placeholders positioned using PX_PER_INCH from physical dimensions
    const convertPlaceholderToPixels = (
        placeholder: any,
        mockupImgWidth: number,   // raw image width in pixels
        mockupImgHeight: number,  // raw image height in pixels
        physicalDimensions: { width: number; height: number }
    ) => {
        const physW = physicalDimensions.width;
        const physH = physicalDimensions.height;

        // CanvasMockup constants (must match admin editor exactly)
        const CANVAS_WIDTH = 800;
        const CANVAS_HEIGHT = 600;
        const CANVAS_PADDING = 40;
        const EFFECTIVE_W = CANVAS_WIDTH - CANVAS_PADDING * 2; // 720
        const EFFECTIVE_H = CANVAS_HEIGHT - CANVAS_PADDING * 2; // 520

        // PX_PER_INCH used in CanvasMockup for converting inches to stage pixels
        const pxPerInchCanvas = Math.min(EFFECTIVE_W / physW, EFFECTIVE_H / physH);

        // How the mockup image is sized and centered in CanvasMockup
        const aspectRatio = mockupImgWidth / mockupImgHeight;
        let imgCanvasW = EFFECTIVE_W;
        let imgCanvasH = imgCanvasW / aspectRatio;
        if (imgCanvasH > EFFECTIVE_H) {
            imgCanvasH = EFFECTIVE_H;
            imgCanvasW = EFFECTIVE_H * aspectRatio;
        }

        // Mockup image position in stage coordinates (top-left corner)
        // This is how CanvasMockup.tsx centers the image:
        // const x = canvasPadding + (maxWidth - width) / 2;
        const imgStageX = CANVAS_PADDING + (EFFECTIVE_W - imgCanvasW) / 2;
        const imgStageY = CANVAS_PADDING + (EFFECTIVE_H - imgCanvasH) / 2;

        // Scale factor: from canvas pixels to raw image pixels
        const scaleToRaw = mockupImgWidth / imgCanvasW;

        // Check if placeholder uses inch values
        const usesInches = placeholder.xIn !== undefined || placeholder.widthIn !== undefined;

        if (usesInches) {
            const xIn = placeholder.xIn || 0;
            const yIn = placeholder.yIn || 0;
            const widthIn = placeholder.widthIn || 0;
            const heightIn = placeholder.heightIn || 0;
            const rotation = placeholder.rotationDeg || placeholder.rotation || 0;

            // Step 1: Convert inches to stage coordinates (same formula as CanvasMockup)
            // In CanvasMockup, placeholders are rendered at:
            //   x_stage = canvasPadding + xIn * PX_PER_INCH
            const xStage = CANVAS_PADDING + xIn * pxPerInchCanvas;
            const yStage = CANVAS_PADDING + yIn * pxPerInchCanvas;
            const wStage = widthIn * pxPerInchCanvas;
            const hStage = heightIn * pxPerInchCanvas;

            // Step 2: Get position relative to mockup image top-left in stage coords
            const xRelStage = xStage - imgStageX;
            const yRelStage = yStage - imgStageY;

            // Step 3: Scale to raw image pixels
            const x = xRelStage * scaleToRaw;
            const y = yRelStage * scaleToRaw;
            const width = wStage * scaleToRaw;
            const height = hStage * scaleToRaw;

            console.log('📐 Converted inches to raw image pixels:', {
                input: { xIn, yIn, widthIn, heightIn },
                physicalDims: { physW, physH },
                canvasGeometry: {
                    pxPerInchCanvas: pxPerInchCanvas.toFixed(2),
                    imgCanvasW: imgCanvasW.toFixed(1),
                    imgCanvasH: imgCanvasH.toFixed(1),
                    imgStageX: imgStageX.toFixed(1),
                    imgStageY: imgStageY.toFixed(1),
                },
                stageCoords: {
                    xStage: xStage.toFixed(1),
                    yStage: yStage.toFixed(1),
                    wStage: wStage.toFixed(1),
                    hStage: hStage.toFixed(1),
                },
                relativeToImage: {
                    xRelStage: xRelStage.toFixed(1),
                    yRelStage: yRelStage.toFixed(1),
                },
                scaleToRaw: scaleToRaw.toFixed(3),
                output: {
                    x: Math.round(x),
                    y: Math.round(y),
                    width: Math.round(width),
                    height: Math.round(height),
                    rotation
                }
            });

            return { x, y, width, height, rotation };
        } else {
            // Already in pixels
            return {
                x: placeholder.x || 0,
                y: placeholder.y || 0,
                width: placeholder.width || 0,
                height: placeholder.height || 0,
                rotation: placeholder.rotationDeg || placeholder.rotation || 0
            };
        }
    };

    const generateMockupPreview = async (
        mockupUrl: string,
        designUrl: string,
        placeholder: any,
        physicalDimensions: { width: number; height: number }
    ): Promise<string> => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('Could not get canvas context');

            const mockupImg = new Image();
            mockupImg.crossOrigin = 'anonymous';

            mockupImg.onload = () => {
                canvas.width = mockupImg.width;
                canvas.height = mockupImg.height;

                // Draw base mockup
                ctx.drawImage(mockupImg, 0, 0);

                const designImg = new Image();
                designImg.crossOrigin = 'anonymous';

                designImg.onload = () => {
                    // Convert placeholder from inches to pixels
                    const { x, y, width, height, rotation } = convertPlaceholderToPixels(
                        placeholder,
                        mockupImg.width,
                        mockupImg.height,
                        physicalDimensions
                    );

                    // Skip if placeholder has no valid dimensions
                    if (width <= 0 || height <= 0) {
                        console.warn('⚠️ Invalid placeholder dimensions after conversion:', { x, y, width, height });
                        resolve(canvas.toDataURL('image/png')); // Return base mockup
                        return;
                    }

                    ctx.save();

                    // Move to placeholder center for rotation
                    const centerX = x + width / 2;
                    const centerY = y + height / 2;
                    ctx.translate(centerX, centerY);
                    ctx.rotate((rotation * Math.PI) / 180);

                    // Clip to placeholder rectangle
                    ctx.beginPath();
                    ctx.rect(-width / 2, -height / 2, width, height);
                    ctx.clip();

                    // Draw design image with cover fit
                    const designAspect = designImg.width / designImg.height;
                    const placeholderAspect = width / height;

                    let drawWidth, drawHeight, drawX, drawY;

                    if (designAspect > placeholderAspect) {
                        // Design is wider than placeholder
                        drawHeight = height;
                        drawWidth = height * designAspect;
                        drawX = -drawWidth / 2;
                        drawY = -height / 2;
                    } else {
                        // Design is taller than placeholder
                        drawWidth = width;
                        drawHeight = width / designAspect;
                        drawX = -width / 2;
                        drawY = -drawHeight / 2;
                    }

                    ctx.drawImage(designImg, drawX, drawY, drawWidth, drawHeight);

                    ctx.restore();

                    try {
                        resolve(canvas.toDataURL('image/png'));
                    } catch (e) {
                        console.error('Canvas export failed (likely CORS):', e);
                        reject(e);
                    }
                };

                designImg.onerror = () => reject('Failed to load design image');
                designImg.src = designUrl;
            };

            mockupImg.onerror = () => reject('Failed to load mockup image');
            mockupImg.src = mockupUrl;
        });
    };

    useEffect(() => {
        const load = async () => {
            if (!storeProductId) {
                setError('Missing storeProductId. Please go back to the design editor and try again.');
                return;
            }
            try {
                setIsLoading(true);
                setError(null);
                const resp = await storeProductsApi.getById(storeProductId);
                if (resp && resp.success !== false) {
                    setStoreProduct(resp.data);
                } else {
                    setError('Failed to load store product');
                }
            } catch (e: any) {
                setError(e?.message || 'Failed to load store product');
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [storeProductId]);

    // Fetch sampleMockups from productcatalogs collection
    useEffect(() => {
        const loadSampleMockups = async () => {
            if (!storeProduct?.catalogProductId) {
                return;
            }

            try {
                setIsLoadingMockups(true);
                const resp = await productApi.getById(storeProduct.catalogProductId);
                if (resp && resp.success !== false && resp.data) {
                    const catalogProduct = resp.data;

                    // Extract available colors from catalog product
                    if (Array.isArray(catalogProduct.availableColors) && catalogProduct.availableColors.length > 0) {
                        setAvailableColors(catalogProduct.availableColors);
                    }

                    // Store variants for per-view base images
                    if (Array.isArray(catalogProduct.variants)) {
                        setVariants(catalogProduct.variants);
                    }

                    // Extract sampleMockups from product design
                    const productDesign = catalogProduct.design || {};
                    const mockups = productDesign.sampleMockups || [];
                    setSampleMockups(mockups);

                    // Also get physical dimensions for inch-to-pixel conversion
                    const physDims = productDesign.physicalDimensions;
                    if (physDims) {
                        setCatalogPhysicalDimensions({
                            width: physDims.width || 20,
                            height: physDims.height || 24
                        });
                    } else {
                        // Default physical dimensions (same as DesignEditor defaults)
                        setCatalogPhysicalDimensions({ width: 20, height: 24 });
                    }

                    console.log('✅ Loaded sampleMockups from productcatalogs:', {
                        catalogProductId: storeProduct.catalogProductId,
                        sampleMockupsCount: mockups.length,
                        physicalDimensions: physDims || 'using defaults (20x24)',
                        sampleMockups: mockups.map((m: any) => ({
                            id: m.id,
                            viewKey: m.viewKey,
                            imageUrl: m.imageUrl ? 'present' : 'missing',
                            placeholders: m.placeholders?.map((p: any) => ({
                                id: p.id,
                                xIn: p.xIn,
                                yIn: p.yIn,
                                widthIn: p.widthIn,
                                heightIn: p.heightIn
                            }))
                        }))
                    });
                }
            } catch (e: any) {
                console.error('❌ Error loading sampleMockups from productcatalogs:', e);
                // Don't set error state - this is optional data
            } finally {
                setIsLoadingMockups(false);
            }
        };

        if (storeProduct?.catalogProductId) {
            loadSampleMockups();
        }
    }, [storeProduct?.catalogProductId]);

    const designData = storeProduct?.designData || {};

    // Extract selected colors, sizes, and primary color from designData
    useEffect(() => {
        if (storeProduct?.designData) {
            const designData = storeProduct.designData;

            // Extract selected colors
            if (Array.isArray(designData.selectedColors)) {
                setSelectedColors(designData.selectedColors);
            } else if (state.selectedColors && Array.isArray(state.selectedColors)) {
                // Fallback to navigation state if available
                setSelectedColors(state.selectedColors);
            }

            // Extract selected sizes
            if (Array.isArray(designData.selectedSizes)) {
                setSelectedSizes(designData.selectedSizes);
            } else if (state.selectedSizes && Array.isArray(state.selectedSizes)) {
                // Fallback to navigation state if available
                setSelectedSizes(state.selectedSizes);
            }

            // Extract selected sizes by color
            if (designData.selectedSizesByColor && typeof designData.selectedSizesByColor === 'object') {
                setSelectedSizesByColor(designData.selectedSizesByColor);
            }

            // Extract primary color hex for garment tinting
            if (typeof designData.primaryColorHex === 'string') {
                setPrimaryColorHex(designData.primaryColorHex);
            } else if (state.primaryColorHex && typeof state.primaryColorHex === 'string') {
                // Fallback to navigation state if available
                setPrimaryColorHex(state.primaryColorHex);
            }

            console.log('✅ Extracted color/size selections from designData:', {
                selectedColors: designData.selectedColors || state.selectedColors,
                selectedSizes: designData.selectedSizes || state.selectedSizes,
                selectedSizesByColor: designData.selectedSizesByColor,
                primaryColorHex: designData.primaryColorHex || state.primaryColorHex,
            });
        }
    }, [storeProduct?.designData, state.selectedColors, state.selectedSizes, state.primaryColorHex]);

    // Set current preview color when colors are loaded
    useEffect(() => {
        const colorsToUse = selectedColors.length > 0 ? selectedColors : availableColors;
        if (colorsToUse.length > 0 && !currentPreviewColor) {
            setCurrentPreviewColor(colorsToUse[0]);
        }
    }, [selectedColors, availableColors, currentPreviewColor]);

    // Helper function to convert color name to hex code
    const getColorHex = (colorName: string): string => {
        const colorMap: { [key: string]: string } = {
            'black': '#000000',
            'white': '#FFFFFF',
            'red': '#FF0000',
            'blue': '#0000FF',
            'green': '#008000',
            'yellow': '#FFFF00',
            'orange': '#FFA500',
            'purple': '#800080',
            'pink': '#FFC0CB',
            'brown': '#A52A2A',
            'grey': '#808080',
            'gray': '#808080',
            'navy': '#000080',
            'maroon': '#800000',
            'olive': '#808000',
            'lime': '#00FF00',
            'aqua': '#00FFFF',
            'teal': '#008080',
            'silver': '#C0C0C0',
            'gold': '#FFD700',
            'beige': '#F5F5DC',
            'tan': '#D2B48C',
            'khaki': '#F0E68C',
            'coral': '#FF7F50',
            'salmon': '#FA8072',
            'turquoise': '#40E0D0',
            'lavender': '#E6E6FA',
            'ivory': '#FFFFF0',
            'cream': '#FFFDD0',
            'mint': '#98FF98',
            'peach': '#FFE5B4',
            'cerulean frost': '#6D9BC3',
            'cerulean': '#6D9BC3',
            'cobalt blue': '#0047AB',
            'amber': '#FFBF00',
            'frosted': '#E8E8E8',
            'natural': '#FAF0E6',
            'beige-gray': '#9F9F9F',
            'clear': '#FFFFFF',
            'kraft': '#D4A574',
        };

        const normalized = colorName.toLowerCase().trim();
        return colorMap[normalized] || '#CCCCCC';
    };

    // Get the hex color for the current preview color
    const currentPreviewColorHex = currentPreviewColor ? getColorHex(currentPreviewColor) : null;

    // Colors to display in selector (use selectedColors if available, otherwise availableColors)
    const colorsToDisplay = selectedColors.length > 0 ? selectedColors : availableColors;

    // Filter mockups based on selected color - MEMOIZED for use in effects/callbacks
    const filteredMockups = useMemo(() => {
        let result = sampleMockups.filter((m: any) =>
            !m.colorKey || // Show generic mockups for all colors
            (currentPreviewColor && m.colorKey === currentPreviewColor) // Show specific color mockups
        );

        // Augment with variant-specific base images if no mockup exists for a view
        if (currentPreviewColor && variants.length > 0) {
            const activeVariant = variants.find((v: any) => v.color === currentPreviewColor);
            if (activeVariant && activeVariant.viewImages) {
                (['front', 'back', 'left', 'right'] as const).forEach((view) => {
                    const variantImageUrl = activeVariant.viewImages[view];
                    if (!variantImageUrl) return;

                    // Check if we already have a mockup for this view
                    const hasMockup = result.some((m: any) => m.viewKey === view);

                    // If no mockup exists for this view, add the variant image as a "flat" mockup
                    if (!hasMockup) {
                        // Find master placeholders for this view from designData
                        const masterView = designData?.views?.find((v: any) => v.key === view);
                        const masterPlaceholders = masterView?.placeholders || [];

                        result.push({
                            id: `variant-${activeVariant.id}-${view}`,
                            viewKey: view,
                            colorKey: currentPreviewColor,
                            imageUrl: variantImageUrl,
                            placeholders: masterPlaceholders,
                            displacementSettings: null, // Will use default
                            isVariantFallback: true // Flag for UI distinction if needed
                        });
                    }
                });
            }
        }
        return result;
    }, [sampleMockups, currentPreviewColor, variants, designData]);

    // Helper to get mockups for a specific color
    const getMockupsForColor = useCallback((color: string) => {
        let result = sampleMockups.filter((m: any) =>
            !m.colorKey || // Show generic mockups for all colors
            m.colorKey === color // Show specific color mockups
        );

        // Augment with variant-specific base images if no mockup exists for a view
        if (variants.length > 0) {
            const activeVariant = variants.find((v: any) => v.color === color);
            if (activeVariant && activeVariant.viewImages) {
                (['front', 'back', 'left', 'right'] as const).forEach((view) => {
                    const variantImageUrl = activeVariant.viewImages[view];
                    if (!variantImageUrl) return;

                    const hasMockup = result.some((m: any) => m.viewKey === view);
                    if (!hasMockup) {
                        const masterView = designData?.views?.find((v: any) => v.key === view);
                        const masterPlaceholders = masterView?.placeholders || [];
                        result.push({
                            id: `variant-${activeVariant._id || activeVariant.id}-${view}-${color.replace(/\s+/g, '-')}`,
                            viewKey: view,
                            colorKey: color,
                            imageUrl: variantImageUrl,
                            placeholders: masterPlaceholders,
                            displacementSettings: null,
                            isVariantFallback: true
                        });
                    }
                });
            }
        }
        return result;
    }, [sampleMockups, variants, designData]);

    // Generate mockups grouped by ALL colors for row-wise display
    const allColorMockups = useMemo(() => {
        const colors = colorsToDisplay.length > 0 ? colorsToDisplay : [];
        return colors.map(color => ({
            color,
            colorHex: getColorHex(color),
            mockups: getMockupsForColor(color)
        }));
    }, [colorsToDisplay, getMockupsForColor, getColorHex]);

    // Extract design images per view from elements array
    // The design is stored in designData.elements, each element has a `view` property and `imageUrl`
    const designImagesByView: Record<string, string> = (() => {
        const result: Record<string, string> = {};

        // Method 1: Check designData.views (object format like { front: { imageUrl: '...' } })
        if (designData.views && typeof designData.views === 'object') {
            Object.keys(designData.views).forEach((viewKey) => {
                const normalizedKey = viewKey.toLowerCase();
                const viewData = designData.views[viewKey];
                if (viewData?.imageUrl) {
                    result[normalizedKey] = viewData.imageUrl;
                }
            });
        }

        // Method 2: Check designData.designUrlsByPlaceholder (keyed by view)
        if (designData.designUrlsByPlaceholder && typeof designData.designUrlsByPlaceholder === 'object') {
            Object.keys(designData.designUrlsByPlaceholder).forEach((viewKey) => {
                const normalizedKey = viewKey.toLowerCase();
                const viewDesigns = designData.designUrlsByPlaceholder[viewKey];
                // Take the first design URL for this view
                if (viewDesigns && typeof viewDesigns === 'object') {
                    const urls = Object.values(viewDesigns);
                    if (urls.length > 0 && typeof urls[0] === 'string') {
                        result[normalizedKey] = urls[0] as string;
                    }
                }
            });
        }

        // Method 3: Extract from designData.elements (array of design elements)
        if (Array.isArray(designData.elements) && designData.elements.length > 0) {
            designData.elements.forEach((el: any) => {
                if (el?.type === 'image' && el?.imageUrl && el?.visible !== false) {
                    const viewKey = (el.view || 'front').toLowerCase();
                    // If we don't have a design for this view yet, use this element's imageUrl
                    // Prefer higher zIndex elements (later in array or explicit zIndex)
                    if (!result[viewKey]) {
                        result[viewKey] = el.imageUrl;
                    }
                }
            });
        }

        // Method 4: Check savedPreviewImages
        if (designData.savedPreviewImages && typeof designData.savedPreviewImages === 'object') {
            Object.keys(designData.savedPreviewImages).forEach((viewKey) => {
                const normalizedKey = viewKey.toLowerCase();
                if (!result[normalizedKey] && designData.savedPreviewImages[viewKey]) {
                    result[normalizedKey] = designData.savedPreviewImages[viewKey];
                }
            });
        }

        console.log('📐 Extracted designImagesByView:', result);
        return result;
    })();

    // Batch generate previews for sample mockups
    useEffect(() => {
        const generateAllPreviews = async () => {
            if (sampleMockups.length === 0) {
                console.log('⏭️ No sample mockups to generate previews for');
                return;
            }

            const hasDesignImages = Object.keys(designImagesByView).length > 0;
            if (!hasDesignImages) {
                console.log('⏭️ No design images found to composite onto mockups');
                console.log('   designData structure:', {
                    hasViews: !!designData.views,
                    hasElements: Array.isArray(designData.elements) ? designData.elements.length : 0,
                    hasDesignUrlsByPlaceholder: !!designData.designUrlsByPlaceholder,
                    hasSavedPreviewImages: !!designData.savedPreviewImages,
                });
                return;
            }

            if (!catalogPhysicalDimensions) {
                console.log('⏭️ Waiting for catalog physical dimensions...');
                return;
            }

            console.log('🎨 Starting preview generation for', sampleMockups.length, 'mockups');
            console.log('   Available design images by view:', designImagesByView);
            console.log('   Physical dimensions:', catalogPhysicalDimensions);

            const tasks = sampleMockups.map(async (mockup) => {
                if (!mockup.id || !mockup.imageUrl) {
                    console.log(`⏭️ Skipping mockup (no id or imageUrl):`, mockup);
                    return;
                }

                // Normalize viewKey (case-insensitive)
                const rawViewKey = mockup.viewKey || 'front';
                const viewKey = rawViewKey.toLowerCase();

                // Find design image for this view
                const designImageUrl = designImagesByView[viewKey];

                if (!designImageUrl) {
                    console.log(`⏭️ No design image for view "${viewKey}" (mockup ${mockup.id})`);
                    return;
                }

                // Cache key: mockupId:designUrl
                const cacheKey = `${mockup.id}:${designImageUrl}`;
                if (previewCache.current[cacheKey]) {
                    console.log(`✅ Using cached preview for mockup ${mockup.id}`);
                    setPreviewMap(prev => ({ ...prev, [mockup.id]: previewCache.current[cacheKey] }));
                    return;
                }

                // Check if already generating
                if (generatingMap[mockup.id]) {
                    console.log(`⏳ Already generating preview for mockup ${mockup.id}`);
                    return;
                }

                try {
                    setGeneratingMap(prev => ({ ...prev, [mockup.id]: true }));

                    // Use first placeholder if multiple exist
                    const placeholder = mockup.placeholders?.[0];
                    if (!placeholder) {
                        console.warn(`⚠️ No placeholders for mockup ${mockup.id}`);
                        return;
                    }

                    console.log(`🖼️ Generating preview for mockup ${mockup.id}:`, {
                        viewKey,
                        designImageUrl: designImageUrl.substring(0, 50) + '...',
                        placeholder: {
                            xIn: placeholder.xIn,
                            yIn: placeholder.yIn,
                            widthIn: placeholder.widthIn,
                            heightIn: placeholder.heightIn,
                            rotationDeg: placeholder.rotationDeg || 0
                        },
                        physicalDimensions: catalogPhysicalDimensions
                    });

                    const previewUrl = await generateMockupPreview(
                        mockup.imageUrl,
                        designImageUrl,
                        placeholder,
                        catalogPhysicalDimensions
                    );

                    previewCache.current[cacheKey] = previewUrl;
                    setPreviewMap(prev => ({ ...prev, [mockup.id]: previewUrl }));
                    console.log(`✅ Generated preview for mockup ${mockup.id}`);
                } catch (e) {
                    console.error(`❌ Failed to generate preview for mockup ${mockup.id}:`, e);
                } finally {
                    setGeneratingMap(prev => ({ ...prev, [mockup.id]: false }));
                }
            });

            await Promise.all(tasks);
        };

        generateAllPreviews();
    }, [sampleMockups, designImagesByView, catalogPhysicalDimensions]);

    // Capture WebGL canvas for a specific mockup
    const captureWebGLPreview = useCallback(async (mockupId: string): Promise<string | null> => {
        const container = webglContainerRefs.current[mockupId];
        if (!container) {
            console.warn(`WebGL container not found for mockup ${mockupId}`);
            return null;
        }

        // Wait for canvas to be ready
        await new Promise(resolve => setTimeout(resolve, 300));
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);

        // Find the canvas element
        let canvas = container.querySelector('canvas');
        if (!canvas) {
            const divs = container.querySelectorAll('div');
            for (const div of Array.from(divs)) {
                canvas = div.querySelector('canvas');
                if (canvas) break;
            }
        }

        if (!canvas) {
            console.warn(`Canvas element not found for mockup ${mockupId}`);
            return null;
        }

        return new Promise((resolve) => {
            canvas!.toBlob(async (blob) => {
                if (!blob) {
                    console.error('Failed to convert canvas to blob');
                    resolve(null);
                    return;
                }

                try {
                    const formData = new FormData();
                    formData.append('image', blob, `mockup-preview-${mockupId}.png`);

                    const API_BASE_URL = RAW_API_URL;
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
                        console.log(`✅ Uploaded WebGL preview for mockup ${mockupId}:`, data.url);
                        resolve(data.url);
                    } else {
                        console.error('Failed to upload preview:', data.message);
                        resolve(null);
                    }
                } catch (error) {
                    console.error('Error uploading preview:', error);
                    resolve(null);
                }
            }, 'image/png', 1.0);
        });
    }, []);

    // Save a single mockup preview
    const saveMockupPreview = useCallback(async (mockupId: string) => {
        if (!storeProductId) {
            toast.error('No store product ID available');
            return;
        }

        setSavingMockups(prev => ({ ...prev, [mockupId]: true }));

        try {
            const previewUrl = await captureWebGLPreview(mockupId);
            if (!previewUrl) {
                toast.error('Failed to capture preview');
                return;
            }

            // Find the mockup to get its viewKey
            const mockup = filteredMockups.find((m: any) => m.id === mockupId);
            const viewKey = mockup?.viewKey || 'front';
            // Use currentPreviewColor for colorKey, normalized to lowercase with dashes
            const colorKey = currentPreviewColor?.toLowerCase().replace(/\s+/g, '-') || 'default';

            // Save to storeproducts database with model type separation
            await storeProductsApi.saveMockup(storeProductId, {
                mockupType: 'model',
                viewKey: viewKey,
                colorKey: colorKey,
                imageUrl: previewUrl,
            });

            setSavedMockupUrls(prev => ({ ...prev, [mockupId]: previewUrl }));
            toast.success(`Saved model preview for ${colorKey}/${viewKey}`);
        } catch (error: any) {
            console.error('Failed to save mockup preview:', error);
            toast.error(error?.message || 'Failed to save preview');
        } finally {
            setSavingMockups(prev => ({ ...prev, [mockupId]: false }));
        }
    }, [storeProductId, captureWebGLPreview, filteredMockups, currentPreviewColor]);

    // Save all mockup previews for ALL colors × ALL views
    const saveAllMockupPreviews = useCallback(async () => {
        if (!storeProductId) {
            toast.error('No store product ID available');
            return;
        }

        // Collect ALL mockups from all colors
        const allMockupsToSave: Array<{ color: string; mockup: any }> = [];
        for (const { color, mockups } of allColorMockups) {
            for (const mockup of mockups) {
                if (mockup.id) {
                    allMockupsToSave.push({ color, mockup });
                }
            }
        }

        if (allMockupsToSave.length === 0) {
            toast.warning('No mockups to save');
            return;
        }

        setIsSavingAll(true);
        const savedUrls: Record<string, string> = {};
        let successCount = 0;

        toast.info(`Saving ${allMockupsToSave.length} mockup previews across ${allColorMockups.length} color(s)...`);

        for (const { color, mockup } of allMockupsToSave) {
            const mockupKey = `${color}:${mockup.id}`;
            setSavingMockups(prev => ({ ...prev, [mockupKey]: true }));

            try {
                // Wait a bit between captures to let WebGL settle
                await new Promise(resolve => setTimeout(resolve, 500));

                const previewUrl = await captureWebGLPreview(mockupKey);
                if (previewUrl) {
                    savedUrls[mockupKey] = previewUrl;
                    successCount++;

                    // Normalize color for storage key
                    const colorKey = color.toLowerCase().replace(/\s+/g, '-');
                    const viewKey = mockup.viewKey || 'front';

                    // Save to storeproducts with model type separation
                    await storeProductsApi.saveMockup(storeProductId, {
                        mockupType: 'model',
                        viewKey: viewKey,
                        colorKey: colorKey,
                        imageUrl: previewUrl,
                    });
                }
            } catch (error) {
                console.error(`Failed to save mockup ${mockupKey}:`, error);
            } finally {
                setSavingMockups(prev => ({ ...prev, [mockupKey]: false }));
            }
        }

        setSavedMockupUrls(prev => ({ ...prev, ...savedUrls }));
        setAllSaved(successCount === allMockupsToSave.length);
        setIsSavingAll(false);

        if (successCount === allMockupsToSave.length) {
            toast.success(`All ${successCount} model mockups saved for ${allColorMockups.length} color(s)!`);
        } else {
            toast.warning(`Saved ${successCount} of ${allMockupsToSave.length} previews`);
        }
    }, [storeProductId, allColorMockups, captureWebGLPreview]);

    // Mark WebGL as ready for a mockup
    const handleWebGLReady = useCallback((mockupId: string) => {
        setWebglReadyMap(prev => ({ ...prev, [mockupId]: true }));
    }, []);

    // Auto-save previews when data is ready
    useEffect(() => {
        if (
            !hasAutoSaved &&
            storeProductId &&
            allColorMockups.length > 0 &&
            Object.keys(designImagesByView).length > 0 &&
            catalogPhysicalDimensions &&
            !isSavingAll &&
            !isLoadingMockups
        ) {
            // Identify mockups that are expected to be rendered with WebGL
            // Condition matches the render logic: mockup.imageUrl && hasDesignForView && hasPlaceholder && catalogPhysicalDimensions
            const expectedMockups: string[] = [];

            allColorMockups.forEach(group => {
                group.mockups.forEach((m: any) => {
                    const viewKey = (m.viewKey || 'front').toLowerCase();
                    const hasDesignForView = !!designImagesByView[viewKey];
                    const hasPlaceholder = Array.isArray(m.placeholders) && m.placeholders.length > 0;

                    if (m.imageUrl && hasDesignForView && hasPlaceholder) {
                        const mockupKey = `${group.color}:${m.id}`;
                        expectedMockups.push(mockupKey);
                    }
                });
            });

            // Check if all expected mockups are ready
            const allReady = expectedMockups.length > 0 && expectedMockups.every(key => webglReadyMap[key]);

            if (allReady) {
                console.log(`✅ All ${expectedMockups.length} WebGL mockups are ready. Triggering auto-save...`);
                saveAllMockupPreviews();
                setHasAutoSaved(true);
            } else if (expectedMockups.length > 0) {
                // Optional: Log progress
                const readyCount = expectedMockups.filter(key => webglReadyMap[key]).length;
                console.log(`⏳ Waiting for WebGL mockups to load: ${readyCount}/${expectedMockups.length} ready`);
            }
        }
    }, [
        hasAutoSaved,
        storeProductId,
        allColorMockups,
        designImagesByView,
        catalogPhysicalDimensions,
        isSavingAll,
        isLoadingMockups,
        saveAllMockupPreviews,
        webglReadyMap // Added dependency
    ]);

    const previewImagesByView: Record<string, string> = designData.previewImagesByView || {};

    // Fallback: derive image previews from designData.elements when previewImagesByView is empty
    const imageElements: Array<any> = Array.isArray(designData.elements)
        ? designData.elements.filter((el: any) => el?.type === 'image' && el?.imageUrl)
        : [];

    const imagesByView: Record<string, any[]> = imageElements.reduce((acc: Record<string, any[]>, el: any) => {
        const viewKey = el.view || 'default';
        if (!acc[viewKey]) acc[viewKey] = [];
        acc[viewKey].push(el);
        return acc;
    }, {} as Record<string, any[]>);



    return (
        <div className="min-h-screen bg-background">
            <main className="max-w-9xl px-3 py-8">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Mockups library</h1>
                        <p className="text-muted-foreground text-sm">
                            Preview design data fetched from the store product and prepare for mockup generation.
                        </p>
                    </div>
                </div>

                {error && (
                    <Card className="mb-6 border-destructive/40 bg-destructive/5">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <CardTitle className="text-sm">Error</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-destructive">{error}</CardContent>
                    </Card>
                )}

                {isLoading && (
                    <p className="text-sm text-muted-foreground">Loading store product…</p>
                )}

                {!isLoading && !error && storeProduct && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle>Store product</CardTitle>
                                <CardDescription>Basic information and status</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Title</p>
                                    <p className="font-medium">{storeProduct.title || state.title || 'Untitled product'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <p className="font-medium capitalize">{storeProduct.status || 'draft'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Price</p>
                                    <p className="font-medium">{storeProduct.sellingPrice ? `₹${storeProduct.sellingPrice.toFixed(2)}` : '-'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Store product ID</p>
                                    <p className="font-mono text-xs break-all">{storeProductId}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Design previews</CardTitle>
                                <CardDescription>
                                    Preview images per view (front, back, etc.) from stored preview URLs or image elements in <code>designData.elements</code>.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Check for preview images and render them in a grid layout */}
                                {Object.keys(previewImagesByView).length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                        {Object.entries(previewImagesByView).map(([viewKey, url]) => (
                                            <div key={viewKey} className="space-y-3">
                                                <div className="border rounded-lg overflow-hidden bg-muted">
                                                    <img
                                                        src={url}
                                                        alt={`${viewKey} preview`}
                                                        className="w-full h-auto max-h-[420px] object-contain"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={url} target="_blank" rel="noreferrer">
                                                            Open original
                                                        </a>
                                                    </Button>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <a href={url} download target="_blank" rel="noreferrer">
                                                            Download
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : imageElements.length > 0 ? (
                                    // Displaying design elements in a grid layout
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                        {Object.entries(imagesByView).map(([viewKey, els]) => (
                                            <div key={viewKey} className="space-y-4">
                                                <div className="grid grid-cols-1 gap-4">
                                                    {els.map((el: any, idx: number) => (
                                                        <div key={`${viewKey}-${idx}`} className="border rounded-lg bg-muted overflow-hidden">
                                                            <img
                                                                src={el.imageUrl}
                                                                alt={`${viewKey} design element ${idx + 1}`}
                                                                className="w-full h-auto max-h-[260px] object-contain bg-background"
                                                            />

                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border rounded-lg bg-muted/40 p-8 text-center text-muted-foreground">
                                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm mb-1">No preview images or image elements found for this design.</p>
                                        <p className="text-xs">Create image elements in the design editor, then save/publish the design.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>
                )}

                {!isLoading && !error && !storeProduct && (
                    <p className="text-sm text-muted-foreground">No store product loaded.</p>
                )}

                {/* Realistic WebGL Sample Mockups - ALL COLORS ROW-WISE */}
                {storeProduct && (
                    <div className="mt-8 space-y-6">
                        {/* Color Legend / Quick Info */}
                        {colorsToDisplay.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Choose a color to preview on the mockups</CardTitle>
                                    <CardDescription>
                                        Previews will be generated for all colors below. Click "Save All Previews" to save.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-3">
                                        {colorsToDisplay.map((color) => {
                                            const colorHex = getColorHex(color);
                                            return (
                                                <div
                                                    key={color}
                                                    className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-background"
                                                >
                                                    <div
                                                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                                                        style={{ backgroundColor: colorHex }}
                                                    />
                                                    <span className="text-sm font-medium capitalize">{color}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Sample Mockups - ALL COLORS in rows */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Realistic Mockup Previews</CardTitle>
                                    <CardDescription>
                                        WebGL-rendered realistic previews with displacement mapping
                                        <span className="ml-2">• {allColorMockups.length} color(s) × {sampleMockups.length} mockup(s)</span>
                                    </CardDescription>
                                </div>
                                {allColorMockups.length > 0 && Object.keys(designImagesByView).length > 0 && (
                                    <Button
                                        onClick={saveAllMockupPreviews}
                                        disabled={isSavingAll || allSaved}
                                        className="gap-2"
                                    >
                                        {isSavingAll ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Saving All...
                                            </>
                                        ) : allSaved ? (
                                            <>
                                                <Check className="h-4 w-4" />
                                                All Saved
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Save All Previews
                                            </>
                                        )}
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                {isLoadingMockups ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                            <p className="text-sm text-muted-foreground">Loading sample mockups...</p>
                                        </div>
                                    </div>
                                ) : allColorMockups.length > 0 ? (
                                    <div className="space-y-8">
                                        {allColorMockups.map(({ color, colorHex, mockups }) => {
                                            const colorMockupKey = (mockupId: string) => `${color}:${mockupId}`;
                                            return (
                                                <div key={color} className="space-y-4">
                                                    {/* Color Row Header */}
                                                    <div className="flex items-center gap-3 pb-2 border-b">
                                                        <div
                                                            className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                                                            style={{ backgroundColor: colorHex }}
                                                        />
                                                        <span className="text-lg font-semibold capitalize">{color}</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            ({mockups.length} mockup{mockups.length !== 1 ? 's' : ''})
                                                        </span>
                                                    </div>

                                                    {/* Mockups Grid for this Color */}
                                                    <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-4">
                                                        {mockups.map((mockup: any, index: number) => {
                                                            const viewKey = (mockup.viewKey || 'front').toLowerCase();
                                                            const hasDesignForView = !!designImagesByView[viewKey];
                                                            const hasPlaceholder = Array.isArray(mockup.placeholders) && mockup.placeholders.length > 0;
                                                            const mockupKey = colorMockupKey(mockup.id);
                                                            const isSaving = savingMockups[mockupKey];
                                                            const isSaved = !!savedMockupUrls[mockupKey];
                                                            const mockupDisplacement: DisplacementSettings =
                                                                mockup.displacementSettings || displacementSettings || defaultDisplacementSettings;

                                                            // Build designUrlsByPlaceholder for this mockup's view
                                                            const mockupDesignUrls: Record<string, string> = {};
                                                            if (hasDesignForView && hasPlaceholder) {
                                                                mockup.placeholders.forEach((ph: any) => {
                                                                    if (ph.id && designImagesByView[viewKey]) {
                                                                        mockupDesignUrls[ph.id] = designImagesByView[viewKey];
                                                                    }
                                                                });
                                                            }

                                                            return (
                                                                <div key={mockupKey || index} className="border rounded-lg bg-background overflow-hidden">
                                                                    {/* Header */}
                                                                    <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm font-medium capitalize">{mockup.viewKey || 'front'}</span>
                                                                            {hasDesignForView ? (
                                                                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">✓ Design</span>
                                                                            ) : (
                                                                                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">⚠️ No design</span>
                                                                            )}
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => saveMockupPreview(mockup.id)}
                                                                            disabled={isSaving || !hasDesignForView}
                                                                            className="gap-1"
                                                                        >
                                                                            {isSaving ? (
                                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                            ) : isSaved ? (
                                                                                <Check className="h-3 w-3" />
                                                                            ) : (
                                                                                <Save className="h-3 w-3" />
                                                                            )}
                                                                            {isSaving ? '...' : isSaved ? '✓' : 'Save'}
                                                                        </Button>
                                                                    </div>

                                                                    {/* WebGL Preview */}
                                                                    {mockup.imageUrl && hasDesignForView && hasPlaceholder && catalogPhysicalDimensions ? (
                                                                        <div
                                                                            ref={(el) => { webglContainerRefs.current[mockupKey] = el; }}
                                                                            className="relative flex justify-center items-center"
                                                                            style={{ minHeight: 350 }}
                                                                        >
                                                                            <RealisticWebGLPreview
                                                                                key={`webgl-${mockupKey}-${designImagesByView[viewKey]?.slice(-20) || ''}`}
                                                                                mockupImageUrl={mockup.imageUrl}
                                                                                activePlaceholder={null}
                                                                                placeholders={(mockup.placeholders || []).map((p: any) => ({
                                                                                    ...p,
                                                                                    rotationDeg: p.rotationDeg ?? 0,
                                                                                }))}
                                                                                physicalWidth={catalogPhysicalDimensions.width}
                                                                                physicalHeight={catalogPhysicalDimensions.height}
                                                                                settings={mockupDisplacement}
                                                                                onSettingsChange={(settings) => {
                                                                                    sampleMockups.forEach((m) => {
                                                                                        if (m.id === mockup.id) {
                                                                                            m.displacementSettings = settings;
                                                                                        }
                                                                                    });
                                                                                }}
                                                                                designUrlsByPlaceholder={mockupDesignUrls}
                                                                                previewMode={true}
                                                                                currentView={viewKey}
                                                                                canvasPadding={40}
                                                                                PX_PER_INCH={Math.min(720 / catalogPhysicalDimensions.width, 520 / catalogPhysicalDimensions.height)}
                                                                                onLoad={() => handleWebGLReady(mockupKey)}
                                                                            />
                                                                        </div>
                                                                    ) : mockup.imageUrl ? (
                                                                        <div className="relative bg-muted flex items-center justify-center" style={{ minHeight: 350 }}>
                                                                            <img
                                                                                src={mockup.imageUrl}
                                                                                alt={`${color} ${mockup.viewKey || 'front'} mockup`}
                                                                                className="max-w-full h-auto max-h-[350px] object-contain"
                                                                                crossOrigin="anonymous"
                                                                            />
                                                                            {!hasDesignForView && (
                                                                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                                                                    <p className="text-sm text-muted-foreground">No design for {viewKey}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-[350px] flex items-center justify-center bg-muted">
                                                                            <p className="text-sm text-muted-foreground">No mockup image</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : storeProduct.catalogProductId ? (
                                    <div className="border rounded-lg bg-muted/40 p-8 text-center text-muted-foreground">
                                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm mb-1">No sample mockups found in product catalog.</p>
                                        <p className="text-xs">The product catalog may not have sample mockups configured.</p>
                                    </div>
                                ) : (
                                    <div className="border rounded-lg bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                                        <p>No catalogProductId available to fetch sample mockups.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Continue to Listing Editor */}
                        {allColorMockups.length > 0 && Object.keys(savedMockupUrls).length > 0 && (
                            <div className="flex justify-end">
                                <Button
                                    size="lg"
                                    onClick={() => {
                                        navigate('/listing-editor', {
                                            state: {
                                                ...state,
                                                storeProductId,
                                                savedMockupUrls,
                                            },
                                        });
                                    }}
                                >
                                    Continue to Listing Editor →
                                </Button>
                            </div>
                        )}
                    </div>
                )
                }
            </main >
        </div >
    );
};

export default MockupsLibrary;
