import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Product } from "@/types";
import EnhancedProductCard from "./EnhancedProductCard";

interface EnhancedProductsSectionProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  showViewAllButton?: boolean;
  viewAllLink?: string;
  title?: string;
  subtitle?: string;
}

const EnhancedProductsSection = ({ 
  products, 
  onProductClick, 
  onAddToCart,
  showViewAllButton = false,
  viewAllLink,
  title = "Our Products",
  subtitle
}: EnhancedProductsSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Extract unique categories from products
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((product) => {
      if (product.catalogProduct?.categoryId) {
        const cat = product.subcategoryId || "Other";
        cats.add(cat);
      }
    });
    return ["All", ...Array.from(cats).sort()];
  }, [products]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return products;
    return products.filter((product) => {
      const productCategory = product.subcategoryId || "Other";
      return productCategory === selectedCategory;
    });
  }, [products, selectedCategory]);

  return (
    <section id="products" className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div>
            <span className="text-sm font-medium text-primary tracking-widest uppercase mb-3 block">
              {subtitle || "Shop Collection"}
            </span>
            <h2 className="section-heading text-foreground">{title}</h2>
            <p className="text-muted-foreground mt-3 text-lg">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
            </p>
          </div>

          {/* Filter Pills */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((filter, idx) => {
                const isSelected = filter === selectedCategory;
                return (
                  <button
                    key={filter}
                    onClick={() => setSelectedCategory(filter)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      isSelected
                        ? "bg-foreground text-background"
                        : "bg-secondary text-secondary-foreground hover:bg-foreground hover:text-background"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <EnhancedProductCard
                    product={product}
                    onProductClick={onProductClick}
                    onAddToCart={onAddToCart}
                  />
                </div>
              ))}
            </div>

            {/* View All Button */}
            {showViewAllButton && viewAllLink && (
              <div className="text-center mt-14">
                <Link 
                  to={viewAllLink}
                  className="btn-primary-store inline-block"
                >
                  View All Products
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {selectedCategory === "All" 
                ? "No products available yet. Check back soon!"
                : `No products found in ${selectedCategory} category.`}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default EnhancedProductsSection;

