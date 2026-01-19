
interface ProductDescriptionProps {
    description?: string;
    category?: string;
    subcategory?: string;
    subcategoryIds?: string[];
}

export const ProductDescription = ({
    description = "Natural Dyes – Safe and eco-friendly, suitable for everyday use. 200 GSM Fabric – Mid-weight fabric that is durable and comfortable. Durable Wearing – Built to withstand regular use over the long term. Unisex Clothing – Suitable for both men and women for versatile styling. Preshrunk Fabric – Maintains size and shape after washing for consistent fit. Comfort Fit Style – Designed for relaxed and comfortable everyday wear.",
    category = "Apparel",
    subcategory = "T-Shirt",
    subcategoryIds
}: ProductDescriptionProps) => {
    return (
        <section className="space-y-4">
            <h2 className="section-title">Product Description</h2>
            <div className="max-w-9xl space-y-4 text-muted-foreground leading-relaxed">
                <p>{description}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
                {category && (
                    <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full capitalize">
                        Category: {category}
                    </span>
                )}
                {subcategoryIds && subcategoryIds.length > 0 && (
                    <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full capitalize">
                        {subcategoryIds.join(', ')}
                    </span>
                )}
                {!subcategoryIds && subcategory && (
                    <span className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full capitalize">
                        Subcategory: {subcategory}
                    </span>
                )}
            </div>
        </section>
    );
};
