import type { ProductDesignData } from '@/types/product';

interface PrintAreasProps {
    design?: ProductDesignData;
    placeholderImage?: string; // Base product image (gallery primary image)
}

const getViewLabel = (key: string): string => {
    const labels: Record<string, string> = {
        front: 'Front',
        back: 'Back',
        left: 'Left',
        right: 'Right',
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

export const PrintAreas = ({ design, placeholderImage }: PrintAreasProps) => {
    // Extract print areas from design views
    // Each view with placeholders represents a print area
    const printAreas = design?.views
        ?.filter(view => view.placeholders && view.placeholders.length > 0)
        .map((view) => ({
            id: `view-${view.key}`,
            label: getViewLabel(view.key),
            mockupImageUrl: view.mockupImageUrl, // Actual print-area image from backend
            viewKey: view.key,
            placeholders: view.placeholders,
        })) || [];

    // If no design data, show empty state
    if (printAreas.length === 0) {
        return null; // Don't render if no print areas
    }

    // Use placeholder image (base product image) or fallback
    const baseImage = placeholderImage || '/placeholder.png';

    return (
        <section className="space-y-4">
            <h2 className="section-title">Print Areas</h2>
            <p className="text-muted-foreground text-sm mb-6">
                Available printing zones highlighted in orange. Each area supports high-quality DTG printing.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {printAreas.map((area) => (
                    <div key={area.id} className="text-center space-y-2">
                        <div className="aspect-square bg-secondary rounded-xl overflow-hidden p-4 relative">
                            {/* Base product image (fallback) */}
                            <img
                                // src={baseImage}
                                // alt={`${area.label} base`}
                                className="w-full h-full object-contain absolute inset-0 z-0"
                                loading="lazy"
                                decoding="async"
                            />

                            {/* View mockup image (if available) */}
                            {area.mockupImageUrl?.trim?.() ? (
                                <img
                                    src={area.mockupImageUrl}
                                    alt={area.label}
                                    className="w-full h-full object-contain absolute inset-0 z-10"
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => {
                                        // Hide broken image icon and fall back to base image
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            ) : null}

                            {/* Placeholder print areas (orange overlay boxes) */}
                            <div className="absolute inset-0 z-20 pointer-events-none">
                                {(area.placeholders || []).map((ph) => {
                                    const widthIn = ph.widthIn ?? 0;
                                    const heightIn = ph.heightIn ?? 0;

                                    // Prefer configured physical dimensions; fall back to bounds-derived normalization.
                                    const physicalWidth =
                                        (design?.physicalDimensions?.width && design.physicalDimensions.width > 0
                                            ? design.physicalDimensions.width
                                            : undefined) ?? 20;
                                    const physicalHeight =
                                        (design?.physicalDimensions?.height && design.physicalDimensions.height > 0
                                            ? design.physicalDimensions.height
                                            : undefined) ?? 24;

                                    const leftPct = (ph.xIn / physicalWidth) * 100;
                                    const topPct = (ph.yIn / physicalHeight) * 100;
                                    const wPct = (widthIn / physicalWidth) * 100;
                                    const hPct = (heightIn / physicalHeight) * 100;

                                    const safe = (n: number) =>
                                        Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;

                                    return (
                                        <div
                                            key={ph.id}
                                            className="absolute rounded-sm border-2 border-orange-500/80 bg-orange-500/20"
                                            style={{
                                                left: `${safe(leftPct)}%`,
                                                top: `${safe(topPct)}%`,
                                                width: `${safe(wPct)}%`,
                                                height: `${safe(hPct)}%`,
                                                transform: ph.rotationDeg ? `rotate(${ph.rotationDeg}deg)` : undefined,
                                                transformOrigin: 'center',
                                            }}
                                        />
                                    );
                                })}
                            </div>
                            
                        </div>
                        {/* Only show label, no dimensions or metadata */}
                        <p className="text-sm font-medium text-foreground">{area.label}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};
