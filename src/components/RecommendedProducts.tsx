import { Heart } from "lucide-react";
import { Link, useParams } from "react-router-dom";

// Different products from the Products page
const recommendedProducts = [
    {
        id: "2",
        name: "Classic Hoodie",
        price: 650,
        image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400"
    },
    {
        id: "3",
        name: "V-Neck Tee",
        price: 299,
        image: "https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?w=400"
    },
    {
        id: "4",
        name: "Polo Shirt",
        price: 450,
        image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400"
    },
    {
        id: "5",
        name: "Tank Top",
        price: 249,
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400"
    },
];

export const RecommendedProducts = () => {
    const { id } = useParams<{ id: string }>();

    // Filter out current product and get 4 random different products
    const filteredProducts = recommendedProducts
        .filter(p => p.id !== id)
        .slice(0, 4);

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="section-title mb-0">Recommended Products</h2>
                <Link to="/products" className="text-sm text-primary hover:underline font-medium">
                    View All
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                {filteredProducts.map((product) => (
                    <Link
                        key={product.id}
                        to={`/products/${product.id}`}
                        className="group cursor-pointer"
                    >
                        <div className="relative aspect-square bg-secondary rounded-xl overflow-hidden mb-3 border border-border group-hover:border-primary/30 transition-colors">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <button
                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                                aria-label="Add to wishlist"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                            >
                                <Heart className="w-4 h-4 text-foreground" />
                            </button>
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">From ₹{product.price.toFixed(2)}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};
