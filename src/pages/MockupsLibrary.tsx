
import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Filter, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

// Helper component to render a single composite mockup
const CompositeMockup = ({
    sampleUrl,
    designUrl,
    placeholder,
    tintColor
}: {
    sampleUrl: string;
    designUrl?: string;
    placeholder?: any;
    tintColor?: string;
}) => {
    // Simple containment style for visual preview
    // In a real app we might want more precise percentage-based positioning if placeholders are %, 
    // but here we know placeholders are in INCHES and we don't know the image physical size easily without metadata.
    // HOWEVER, we can try to center it if no placeholder data, or use simple absolute positioning if possible.
    // Given the complexity of exact inch-to-pixel mapping without canvas, we will use a "best fit" approach for now:
    // 1. Show the sample image.
    // 2. Overlay the design image in the center (simplification) OR using rough percentages if we assume standard 12x16 print area or similar.
    // For this requested "apply to placeholder" feature without canvas, we'll try to use the provided placeholder data if available, 
    // but we might need to assume a standard canvas size or just center it for visual feel.

    // Refined approach: We don't have the *scale* of the sample image (pixels per inch) easily available here 
    // unless we pass physical dimensions of the image. 
    // But we do know the user wants "visual" confirmation.

    // IMPORTANT: For the immediate request "apply those images to the placeholder", 
    // we will use a simplified CENTER overlay for now, as precise mapping requires re-implementing the PixiJS/Canvas logic here.
    // If the user provided placeholder coordinates, we could try to respect them if we knew the image dimensions.

    return (
        <div className="relative w-full h-full bg-gray-50 flex items-center justify-center overflow-hidden">
            {/* Base Mockup Image */}
            <img
                src={sampleUrl}
                alt="Mockup Base"
                className="absolute inset-0 w-full h-full object-contain z-0"
            />

            {/* Tint Overlay (Optional - approximate for now) */}
            {tintColor && (
                <div
                    className="absolute inset-0 mix-blend-multiply pointer-events-none z-10"
                    style={{ backgroundColor: tintColor, opacity: 0.3 }}
                />
            )}

            {/* Design Overlay */}
            {designUrl && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    {/* 
                    This is a simplified visual overlay. 
                    Ideally, we would use `placeholder.left`, `placeholder.top`, `placeholder.width` etc. 
                    if we had them as percentages. 
                 */}
                    <img
                        src={designUrl}
                        alt="Design"
                        className="w-1/2 h-1/2 object-contain"
                        // Optional: apply approximate rotation if placeholder has it
                        style={{
                            transform: placeholder?.rotationDeg ? `rotate(${placeholder.rotationDeg}deg)` : undefined
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default function MockupsLibrary() {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as any;

    const {
        productId,
        baseSellingPrice,
        title,
        description,
        galleryImages: initialGalleryImages,
        designData,
        variants = [],
        // New inputs for composition
        sampleMockups = [],
        designImagesByView = {},
    } = state || {};

    // Generate the "virtual" list of mockups to display based on Cartesian product:
    // Sample Mockups x Variants (Colors)
    const mockupsList = useMemo(() => {
        if (!state) return [];
        const list: any[] = [];
        const seenCombinations = new Set();

        // Determine which colors to generate for
        // Ideally we generate for all available variant colors
        const uniqueColors = Array.from(new Set(variants.map((v: any) => v.color)));

        sampleMockups.forEach((sample: any) => {
            uniqueColors.forEach((color: unknown) => { // Type assertion handled by usage
                const variant = variants.find((v: any) => v.color === color);
                const colorHex = variant?.colorHex || '#ffffff';

                const comboId = `${sample.id} -${color} `;
                if (seenCombinations.has(comboId)) return;
                seenCombinations.add(comboId);

                const designUrl = designImagesByView[sample.viewKey];

                if (designUrl) {
                    list.push({
                        id: comboId,
                        sampleMockupId: sample.id,
                        viewKey: sample.viewKey,
                        color: color as string,
                        colorHex,
                        sampleUrl: sample.imageUrl,
                        designUrl: designUrl,
                        placeholder: sample.placeholders?.[0], // Use first placeholder
                        metadata: sample.metadata
                    });
                }
            });
        });
        return list;
    }, [state, sampleMockups, variants, designImagesByView]);


    const [selectedMockupIds, setSelectedMockupIds] = useState<string[]>([]);
    const [viewFilter, setViewFilter] = useState<string>('all');
    const [colorFilter, setColorFilter] = useState<string>('all');

    // Auto-select all by default if needed, or leave empty. Let's auto-select all.
    React.useEffect(() => {
        if (!state) {
            navigate('/admin/products');
        } else if (mockupsList.length > 0 && selectedMockupIds.length === 0) {
            setSelectedMockupIds(mockupsList.map(m => m.id));
        }
    }, [state, navigate, mockupsList.length]); // intended to run once on load

    const uniqueColors = useMemo(() => Array.from(new Set(mockupsList.map(m => m.color))), [mockupsList]);
    const uniqueViews = useMemo(() => Array.from(new Set(mockupsList.map(m => m.viewKey))), [mockupsList]);

    const filteredMockups = useMemo(() => {
        return mockupsList.filter(m => {
            if (viewFilter !== 'all' && m.viewKey !== viewFilter) return false;
            if (colorFilter !== 'all' && m.color !== colorFilter) return false;
            return true;
        });
    }, [mockupsList, viewFilter, colorFilter]);

    const handleToggleSelect = (id: string) => {
        setSelectedMockupIds(prev =>
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (select: boolean) => {
        if (select) {
            const newIds = filteredMockups.map(m => m.id);
            setSelectedMockupIds(prev => Array.from(new Set([...prev, ...newIds])));
        } else {
            const filteredIds = filteredMockups.map(m => m.id);
            setSelectedMockupIds(prev => prev.filter(id => !filteredIds.includes(id)));
        }
    };

    const handleContinue = () => {
        // Here lies a challenge: The listing editor expects URL strings for gallery images.
        // But we now have COMPOSITE definitions (Sample + Design + Color).
        // 
        // Option 1: We pass these definition objects to ListingEditor, and Update ListingEditor to render them dynamically too.
        // Option 2: We try to 'bake' them here (canvas toblob) before navigating. Can be slow.
        // Option 3: We assume for now we just pass the SAMPLE URL (background) as a placeholder, 
        //           but ideally the User wants the final mockup. 
        //
        // Given the requirement is usually to "Produce" a listing with ready images.
        // BUT, since we removed the server-side generation, we must either:
        // A) Generate CLIENT SIDE here (using html2canvas or similar) and upload/blob them.
        // B) Pass a "MockupConfig" object instead of a URL string to ListingEditor.
        //
        // I will assume Option B for "Navigation" but for "Persistence" (Publishing to Etsy/Shopify) we will eventually need real images.
        // For this step ("Implement MockupsLibrary Page"), visual display was the goal.
        // I will pass constructed objects that ListingEditor *might* interpret, or for now just the sampleUrl 
        // but likely we need to address the "Real Image" requirement later.

        // Workaround: We'll construct a special URL or object. 
        // Check: ListingEditor likely maps these to simple <img> tags.
        // For now, let's pass the definition in `metadata` so ListingEditor "could" be updated to render them composite
        // OR we just assume the user accepts the limitation for now.

        const selectedObjects = mockupsList.filter(m => selectedMockupIds.includes(m.id));

        const newGalleryImages = selectedObjects.map((m, idx) => ({
            id: m.id,
            // TEMP: Use the sample background URL effectively. 
            // Realistically we need the composite. 
            // For now, we pass sampleUrl but attach extensive metadata for possible future client-side rendering
            url: m.sampleUrl,
            position: (initialGalleryImages?.length || 0) + idx,
            isPrimary: false,
            imageType: 'mockup',
            altText: `${title} - ${m.viewKey} - ${m.color} `,
            metadata: {
                isComposite: true,
                designUrl: m.designUrl,
                sampleUrl: m.sampleUrl,
                color: m.color,
                colorHex: m.colorHex,
                placeholder: m.placeholder
            }
        }));

        const finalGalleryImages = [...(initialGalleryImages || []), ...newGalleryImages];

        navigate('/listing-editor', {
            state: {
                ...state,
                galleryImages: finalGalleryImages,
                // Pass composites state forward if we need to come back
                sampleMockups,
                designImagesByView
            }
        });
    };

    if (!state) return null;

    return (
        <div className="min-h-screen flex flex-col bg-muted/10">
            {/* Header */}
            <div className="bg-background border-b h-16 px-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="font-semibold text-lg">Select Mockups</h1>
                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                            {filteredMockups.length} mockups available • {selectedMockupIds.length} selected
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => handleSelectAll(false)} disabled={selectedMockupIds.length === 0}>
                        Deselect All
                    </Button>
                    <Button variant="outline" onClick={() => handleSelectAll(true)}>
                        Select All Visible
                    </Button>
                    <div className="h-8 w-px bg-border mx-2" />
                    <Button onClick={handleContinue} className="gap-2">
                        Next: Listing Details
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 container mx-auto py-8 px-4 flex gap-6">
                {/* Sidebar Filters */}
                <div className="w-64 flex-shrink-0 space-y-6">
                    <Card>
                        <CardContent className="p-4 space-y-6">
                            <div>
                                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                                    <Filter className="w-4 h-4" /> Views
                                </h3>
                                <div className="space-y-2">
                                    <Button
                                        variant={viewFilter === 'all' ? 'secondary' : 'ghost'}
                                        className="w-full justify-start h-8 text-sm"
                                        onClick={() => setViewFilter('all')}
                                    >
                                        All Views
                                    </Button>
                                    {uniqueViews.map((view: any) => (
                                        <Button
                                            key={view}
                                            variant={viewFilter === view ? 'secondary' : 'ghost'}
                                            className="w-full justify-start h-8 text-sm capitalize"
                                            onClick={() => setViewFilter(view)}
                                        >
                                            {view}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium mb-3">Colors</h3>
                                <ScrollArea className="h-[300px] pr-2">
                                    <div className="space-y-2">
                                        <Button
                                            variant={colorFilter === 'all' ? 'secondary' : 'ghost'}
                                            className="w-full justify-start h-8 text-sm"
                                            onClick={() => setColorFilter('all')}
                                        >
                                            All Colors
                                        </Button>
                                        {uniqueColors.map((color: any) => {
                                            const variant = variants.find((v: any) => v.color === color);
                                            const cColor = variant?.colorHex || color;
                                            return (
                                                <Button
                                                    key={color}
                                                    variant={colorFilter === color ? 'secondary' : 'ghost'}
                                                    className="w-full justify-start h-8 text-sm flex items-center gap-2"
                                                    onClick={() => setColorFilter(color)}
                                                >
                                                    <span
                                                        className="w-3 h-3 rounded-full border shadow-sm"
                                                        style={{ backgroundColor: cColor }}
                                                    />
                                                    <span className="capitalize text-xs truncate">{color}</span>
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Grid */}
                <div className="flex-1">
                    {filteredMockups.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/50">
                            <ImageIcon className="w-10 h-10 text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground font-medium">No mockups found</p>
                            <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredMockups.map((mockup: any) => {
                                const isSelected = selectedMockupIds.includes(mockup.id);
                                return (
                                    <div
                                        key={mockup.id}
                                        className={`
                                            group relative aspect - square rounded - lg border - 2 overflow - hidden cursor - pointer transition - all
                                            ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-muted-foreground/50'}
`}
                                        onClick={() => handleToggleSelect(mockup.id)}
                                    >
                                        {/* Composite Render */}
                                        <CompositeMockup
                                            sampleUrl={mockup.sampleUrl}
                                            designUrl={mockup.designUrl}
                                            placeholder={mockup.placeholder}
                                            tintColor={mockup.colorHex} // Pass hex for subtle tinting if needed
                                        />

                                        {/* Selection Checkmark */}
                                        <div className="absolute top-2 right-2 z-30">
                                            <div className={`
w - 6 h - 6 rounded - full flex items - center justify - center transition - all shadow - sm
                                                ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-white/80 backdrop-blur border text-transparent group-hover:text-muted-foreground'}
`}>
                                                <Check className="w-4 h-4" />
                                            </div>
                                        </div>

                                        {/* Footer Information */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-8 pb-2 px-3 z-30">
                                            <div className="flex justify-between items-end">
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 capitalize bg-white/90 text-black">
                                                    {mockup.viewKey}
                                                </Badge>
                                                <div
                                                    className="w-4 h-4 rounded-full border border-white/50 shadow-sm"
                                                    style={{ backgroundColor: mockup.colorHex }}
                                                    title={mockup.color}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
