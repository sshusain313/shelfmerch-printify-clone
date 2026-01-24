interface PrintAreasProps {
    design?: {
        views?: Array<{
            key: string;
            mockupImageUrl: string;
            placeholders?: Array<{
                id: string;
                xIn: number;
                yIn: number;
                widthIn?: number;
                heightIn?: number;
            }>;
        }>;
    };
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
        ?.filter(view => view.mockupImageUrl && view.placeholders && view.placeholders.length > 0)
        .map((view) => ({
            id: `view-${view.key}`,
            label: getViewLabel(view.key),
            mockupImageUrl: view.mockupImageUrl, // Actual print-area image from backend
            viewKey: view.key,
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
                            {/* Placeholder mockup image (base product image) */}
                            <img
                                src={baseImage}
                                alt={`${area.label} placeholder`}
                                className="w-full h-full object-contain absolute inset-0"
                            />
                            {/* Actual print-area image (overlay) */}
                            <img
                                src={area.mockupImageUrl}
                                alt={area.label}
                                className="w-full h-full object-contain relative z-10"
                            />
                        </div>
                        {/* Only show label, no dimensions or metadata */}
                        <p className="text-sm font-medium text-foreground">{area.label}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};
