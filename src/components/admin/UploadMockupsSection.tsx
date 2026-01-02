import { useState, useCallback, useEffect } from 'react';
import { ViewTabs } from './ViewTabs';
import { CanvasMockup } from './CanvasMockup';
import { PlaceholderControls } from './PlaceholderControls';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    ViewKey,
    Placeholder,
    SampleMockupImage,
    DisplacementSettings,
    ProductVariant
} from '@/types/product';
import { uploadApi } from '@/lib/api'; // Ensure this exists or use appropriate upload function
import { useToast } from '@/hooks/use-toast';
import { Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface UploadMockupsSectionProps {
    sampleMockups: SampleMockupImage[];
    onSampleMockupsChange: (mockups: SampleMockupImage[]) => void;
    availableColors?: string[];
    selectedColorKey?: string;
    onColorChange?: (colorKey: string) => void;
    physicalWidth?: number;
    physicalHeight?: number;
    physicalLength?: number;
    unit?: 'in' | 'cm';
    variants?: ProductVariant[];
}

export const UploadMockupsSection = ({
    sampleMockups,
    onSampleMockupsChange,
    availableColors = [],
    selectedColorKey,
    onColorChange,
    physicalWidth = 20,
    physicalHeight = 24,
    physicalLength = 18,

    unit = 'in',
    variants = [],
}: UploadMockupsSectionProps) => {
    const [activeView, setActiveView] = useState<ViewKey>('front');
    const [activeMockupId, setActiveMockupId] = useState<string | null>(null);
    const [activePlaceholderId, setActivePlaceholderId] = useState<string | null>(null);
    const [uploadingViews, setUploadingViews] = useState<Set<ViewKey>>(new Set());
    const { toast } = useToast();

    // Filter mockups for the current view AND color
    const currentViewMockups = sampleMockups.filter(m =>
        m.viewKey === activeView &&
        // If colorKey is set on mockup, it must match. If not set (legacy), show for all or 'default'.
        (!m.colorKey || m.colorKey === selectedColorKey)
    );

    // Set active mockup if none selected but mockups exist
    if (!activeMockupId && currentViewMockups.length > 0) {
        setActiveMockupId(currentViewMockups[0].id);
    } else if (activeMockupId && !currentViewMockups.find(m => m.id === activeMockupId) && currentViewMockups.length > 0) {
        setActiveMockupId(currentViewMockups[0].id);
    } else if (currentViewMockups.length === 0 && activeMockupId) {
        setActiveMockupId(null);
    }

    const currentMockup = sampleMockups.find(m => m.id === activeMockupId) || null;
    const activePlaceholder = currentMockup?.placeholders?.find(p => p.id === activePlaceholderId) || null;

    const defaultDisplacement: DisplacementSettings = {
        scaleX: 20,
        scaleY: 20,
        contrastBoost: 1.5,
    };

    const handleImageUpload = useCallback(async (view: ViewKey, file: File) => {
        setUploadingViews(prev => new Set(prev).add(view));

        try {
            const s3Url = await uploadApi.uploadImage(file, 'sample-mockups');

            const newMockup: SampleMockupImage = {
                id: `mockup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                viewKey: view,
                colorKey: selectedColorKey, // Tag with selected color
                imageUrl: s3Url,
                placeholders: [], // Start with empty placeholders
                metadata: {
                    imageType: 'other',
                    caption: file.name,
                    order: currentViewMockups.length,
                }
            };

            onSampleMockupsChange([...sampleMockups, newMockup]);
            setActiveMockupId(newMockup.id);

            toast({
                title: 'Upload successful',
                description: `Sample mockup for ${view} view uploaded successfully`,
            });
        } catch (error) {
            console.error('Error uploading sample mockup:', error);
            toast({
                title: 'Upload failed',
                description: `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: 'destructive',
            });
        } finally {
            setUploadingViews(prev => {
                const next = new Set(prev);
                next.delete(view);
                return next;
            });
        }
    }, [sampleMockups, onSampleMockupsChange, currentViewMockups.length, toast]);

    // Handle removing the ENTIRE mockup image (not just clearing the URL like in Configurator)
    const handleMockupDelete = useCallback((id: string) => {
        const updatedMockups = sampleMockups.filter(m => m.id !== id);
        onSampleMockupsChange(updatedMockups);
        if (activeMockupId === id) {
            setActiveMockupId(null);
        }
    }, [sampleMockups, onSampleMockupsChange, activeMockupId]);

    // Handle removing all images for a view (from ViewTabs)
    const handleViewClear = useCallback((view: ViewKey) => {
        const updatedMockups = sampleMockups.filter(m => m.viewKey !== view);
        onSampleMockupsChange(updatedMockups);
    }, [sampleMockups, onSampleMockupsChange]);

    const handlePlaceholderAdd = useCallback(() => {
        if (!currentMockup) return;

        const defaultWidthIn = 6;
        const defaultHeightIn = 6;
        const isSideView = activeView === 'left' || activeView === 'right';
        const defaultXIn = (isSideView ? physicalLength : physicalWidth) / 2 - defaultWidthIn / 2;
        const defaultYIn = physicalHeight / 2 - defaultHeightIn / 2;

        const newPlaceholder: Placeholder = {
            id: `${activeView}-${Date.now()}`,
            xIn: defaultXIn,
            yIn: defaultYIn,
            widthIn: defaultWidthIn,
            heightIn: defaultHeightIn,
            rotationDeg: 0,
            scale: 1.0,
            lockSize: false,
        };

        const updatedMockups = sampleMockups.map(m =>
            m.id === currentMockup.id
                ? { ...m, placeholders: [...m.placeholders, newPlaceholder] }
                : m
        );

        onSampleMockupsChange(updatedMockups);
        setActivePlaceholderId(newPlaceholder.id);
    }, [currentMockup, activeView, physicalLength, physicalWidth, physicalHeight, sampleMockups, onSampleMockupsChange]);

    const handlePlaceholderChange = useCallback((id: string, updates: Partial<Placeholder>) => {
        if (!currentMockup) return;

        const updatedMockups = sampleMockups.map(m =>
            m.id === currentMockup.id
                ? {
                    ...m,
                    placeholders: m.placeholders.map(p =>
                        p.id === id ? { ...p, ...updates } : p
                    )
                }
                : m
        );
        onSampleMockupsChange(updatedMockups);
    }, [currentMockup, sampleMockups, onSampleMockupsChange]);

    const handleLassoPlaceholderCreate = useCallback((placeholderWithoutId: Omit<Placeholder, 'id'>) => {
        if (!currentMockup) return ""; // Should ideally throw or handle gracefully

        const id = `${activeView}-${Date.now()}`;
        const newPlaceholder: Placeholder = {
            id,
            ...placeholderWithoutId,
        };

        const updatedMockups = sampleMockups.map(m =>
            m.id === currentMockup.id
                ? { ...m, placeholders: [...m.placeholders, newPlaceholder] }
                : m
        );

        onSampleMockupsChange(updatedMockups);
        setActivePlaceholderId(id);
        return id;
    }, [currentMockup, activeView, sampleMockups, onSampleMockupsChange]);


    const handlePlaceholderDelete = useCallback((id: string) => {
        if (!currentMockup) return;

        const updatedMockups = sampleMockups.map(m =>
            m.id === currentMockup.id
                ? { ...m, placeholders: m.placeholders.filter(p => p.id !== id) }
                : m
        );
        onSampleMockupsChange(updatedMockups);
    }, [currentMockup, sampleMockups, onSampleMockupsChange]);

    const handleMetadataChange = useCallback((key: string, value: any) => {
        if (!currentMockup) return;

        const updatedMockups = sampleMockups.map(m =>
            m.id === currentMockup.id
                ? { ...m, metadata: { ...m.metadata, [key]: value } }
                : m
        );
        onSampleMockupsChange(updatedMockups);
    }, [currentMockup, sampleMockups, onSampleMockupsChange]);

    const handleDisplacementChange = useCallback((updates: Partial<DisplacementSettings>) => {
        if (!currentMockup) return;

        const updatedMockups = sampleMockups.map((m) =>
            m.id === currentMockup.id
                ? {
                    ...m,
                    displacementSettings: {
                        ...(m.displacementSettings || defaultDisplacement),
                        ...updates,
                    },
                }
                : m
        );
        onSampleMockupsChange(updatedMockups);
    }, [currentMockup, sampleMockups, onSampleMockupsChange]);


    // Helper for ViewTabs to show counts/preview
    const placeholderCounts: Record<ViewKey, number> = {
        front: sampleMockups.filter(m => m.viewKey === 'front').length,
        back: sampleMockups.filter(m => m.viewKey === 'back').length,
        left: sampleMockups.filter(m => m.viewKey === 'left').length,
        right: sampleMockups.filter(m => m.viewKey === 'right').length,
    };

    // Filter mockups for current color (or generic) to show in tabs status
    const currentColorMockups = sampleMockups.filter(m =>
        (!m.colorKey || m.colorKey === selectedColorKey)
    );

    // Show checkmarks in tabs if an image exists for the current color selection
    const viewImages: Record<ViewKey, string | null> = {
        front: currentColorMockups.find(m => m.viewKey === 'front')?.imageUrl || null,
        back: currentColorMockups.find(m => m.viewKey === 'back')?.imageUrl || null,
        left: currentColorMockups.find(m => m.viewKey === 'left')?.imageUrl || null,
        right: currentColorMockups.find(m => m.viewKey === 'right')?.imageUrl || null,
    };

    // Auto-sync variant view images to sample mockups
    useEffect(() => {
        if (!selectedColorKey || !variants.length) return;

        const variant = variants.find(v => v.color === selectedColorKey);
        if (!variant || !variant.viewImages) return;

        const views: ViewKey[] = ['front', 'back', 'left', 'right'];
        const newMockups: SampleMockupImage[] = [];

        views.forEach(view => {
            const url = variant.viewImages?.[view];
            if (!url) return;

            // Avoid duplicates: check if this view for this color already exists
            const exists = sampleMockups.some(m => m.viewKey === view && m.colorKey === selectedColorKey);
            if (exists) return;

            newMockups.push({
                id: `mockup-${Date.now()}-${view}-${Math.random().toString(36).substr(2, 5)}`,
                viewKey: view,
                colorKey: selectedColorKey,
                imageUrl: url,
                placeholders: [],
                metadata: {
                    imageType: 'other',
                    caption: `Variant Image (${selectedColorKey})`,
                    order: sampleMockups.length + newMockups.length
                }
            });
        });

        if (newMockups.length > 0) {
            onSampleMockupsChange([...sampleMockups, ...newMockups]);
            if (!activeMockupId) {
                setActiveMockupId(newMockups[0].id);
            }
        }
    }, [selectedColorKey, variants, sampleMockups, onSampleMockupsChange, activeMockupId]);

    return (
        <div className="space-y-4">
            {/* 
         Reusing ViewTabs. 
         Note: ViewTabs logic assumes one image per view for onImageRemove. 
         We'll interpret onImageRemove as "clear all for this view" 
      */}

            {/* Color Selector Pills */}
            {availableColors.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {availableColors.map((color) => {
                        const count = sampleMockups.filter(m => m.colorKey === color).length;
                        const isSelected = selectedColorKey === color;

                        return (
                            <Button
                                key={color}
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => onColorChange?.(color)}
                                className={`gap-2 ${isSelected ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                            >
                                <span className={`w-3 h-3 rounded-full border ${color.toLowerCase() === 'white' ? 'border-gray-200' : 'border-transparent'}`}
                                    style={{ backgroundColor: color.toLowerCase() }} />
                                {color}
                                {count > 0 && (
                                    <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        {count}
                                    </span>
                                )}
                            </Button>
                        );
                    })}
                </div>
            )}

            <ViewTabs
                views={['front', 'back', 'left', 'right']}
                activeView={activeView}
                viewImages={viewImages}
                placeholderCounts={placeholderCounts}
                onViewChange={setActiveView}
                onImageUpload={handleImageUpload}
                onImageRemove={handleViewClear}
                uploadingViews={uploadingViews}
            />



            {/* Mockup Selection List (Horizontal Scroll or Grid) */}
            {currentViewMockups.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {currentViewMockups.map((mockup) => (
                        <div
                            key={mockup.id}
                            className={`
                relative group cursor-pointer border-2 rounded-lg overflow-hidden flex-shrink-0 w-24 h-24
                ${mockup.id === activeMockupId ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-muted hover:border-foreground/20'}
              `}
                            onClick={() => setActiveMockupId(mockup.id)}
                        >
                            <img
                                src={mockup.imageUrl}
                                alt="Mockup thumbnail"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMockupDelete(mockup.id);
                                    }}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            {mockup.placeholders.length > 0 && (
                                <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded">
                                    {mockup.placeholders.length} PH
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Upload More Button */}
                    <div className="w-24 h-24 border-2 border-dashed border-muted rounded-lg flex items-center justify-center cursor-pointer hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors relative">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                                if (e.target.files) {
                                    Array.from(e.target.files).forEach(file => handleImageUpload(activeView, file));
                                }
                            }}
                        />
                        <div className="flex flex-col items-center">
                            <ImageIcon className="h-6 w-6 mb-1" />
                            <span className="text-[10px]">Add More</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Editor Area */}
            {currentMockup ? (
                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
                    <CanvasMockup
                        mockupImageUrl={currentMockup.imageUrl}
                        placeholders={currentMockup.placeholders}
                        activePlaceholderId={activePlaceholderId}
                        onPlaceholderChange={handlePlaceholderChange}
                        onPlaceholderSelect={setActivePlaceholderId}
                        onPlaceholderAdd={handlePlaceholderAdd}
                        onPlaceholderDelete={handlePlaceholderDelete}
                        onLassoPlaceholderCreate={handleLassoPlaceholderCreate}
                        canvasWidth={800}
                        canvasHeight={600}
                        physicalWidth={(activeView === 'left' || activeView === 'right') ? physicalLength : physicalWidth}
                        physicalHeight={physicalHeight}
                        unit={unit}
                    />

                    <div className="space-y-4">
                        {/* Mockup Metadata Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Mockup Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Image Type</label>
                                    <Select
                                        value={currentMockup.metadata?.imageType || 'other'}
                                        onValueChange={(val) => handleMetadataChange('imageType', val)}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="lifestyle">Lifestyle</SelectItem>
                                            <SelectItem value="flat-front">Flat Front</SelectItem>
                                            <SelectItem value="flat-back">Flat Back</SelectItem>
                                            <SelectItem value="folded">Folded</SelectItem>
                                            <SelectItem value="person">Person</SelectItem>
                                            <SelectItem value="detail">Detail</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Caption (Optional)</label>
                                    <input
                                        className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={currentMockup.metadata?.caption || ''}
                                        onChange={(e) => handleMetadataChange('caption', e.target.value)}
                                        placeholder="e.g. Woman in park"
                                    />
                                </div>

                                {/* Per-mockup displacement settings */}
                                <div className="pt-2 border-t space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground">
                                        Realism Settings (WebGL displacement)
                                    </p>
                                    {(() => {
                                        const ds = currentMockup.displacementSettings || defaultDisplacement;
                                        return (
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span>Displacement X</span>
                                                        <span className="font-mono">{ds.scaleX}</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={100}
                                                        step={1}
                                                        value={ds.scaleX}
                                                        onChange={(e) =>
                                                            handleDisplacementChange({ scaleX: Number(e.target.value) })
                                                        }
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span>Displacement Y</span>
                                                        <span className="font-mono">{ds.scaleY}</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={100}
                                                        step={1}
                                                        value={ds.scaleY}
                                                        onChange={(e) =>
                                                            handleDisplacementChange({ scaleY: Number(e.target.value) })
                                                        }
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span>Fold Contrast</span>
                                                        <span className="font-mono">{ds.contrastBoost.toFixed(1)}</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min={1}
                                                        max={5}
                                                        step={0.1}
                                                        value={ds.contrastBoost}
                                                        onChange={(e) =>
                                                            handleDisplacementChange({
                                                                contrastBoost: Number(e.target.value),
                                                            })
                                                        }
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Placeholder Controls */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Placeholder Properties</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PlaceholderControls
                                    placeholder={activePlaceholder}
                                    onUpdate={(updates) => {
                                        if (activePlaceholderId) {
                                            handlePlaceholderChange(activePlaceholderId, updates);
                                        }
                                    }}
                                    unit={unit}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            ) : (
                currentViewMockups.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
                        <p className="mb-2">No sample mockups for {activeView} view</p>
                        <p className="text-sm">Upload images above to get started</p>
                    </div>
                )
            )}
        </div>
    );
};
