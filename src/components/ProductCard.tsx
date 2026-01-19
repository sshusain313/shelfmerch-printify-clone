import { useState, useEffect } from "react";
import { X, Palette, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  creator: string;
  badge?: "new" | "bestseller" | "trending";
  colors: string[];
  sizes: string[];
  printMethod: string;
}

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-cycle through images on hover
  useEffect(() => {
    if (!isHovered || product.images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }, 1000); // Change image every 1 second

    return () => clearInterval(interval);
  }, [isHovered, product.images.length]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCloseExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
  };

  return (
    <>
      <div
        className="product-card group relative bg-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-card-hover cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setCurrentImageIndex(0);
        }}
      >
        <Link
          to={`/products/${product.id}`}
          className="group"
        >
          {/* Image container */}
          <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
            <img
              src={product.images[currentImageIndex]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />


          </div>

          {/* Product info */}
          <div className="p-4">
            <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-accent transition-colors">
              {product.name}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  <span className="font-bold text-foreground">From ${product.price}</span>
                </p>
                {/* Color swatches beside price */}
                <div className="flex items-center gap-1">
                  {product.colors.slice(0, 4).map((color) => (
                    <div
                      key={color}
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  {product.colors.length > 4 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      +{product.colors.length - 4}
                    </span>
                  )}
                </div>
              </div>
              {/* Available sizes */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground">Sizes:</span>
                {product.sizes.map((size) => (
                  <span
                    key={size}
                    className="text-xs px-1.5 py-0.5 bg-secondary text-foreground rounded border border-border"
                  >
                    {size}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Expanded detail modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm"
          onClick={handleCloseExpanded}
        >
          <div
            className="bg-background rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="relative">
              <img
                src={product.images[currentImageIndex]}
                alt={product.name}
                className="w-full aspect-[4/3] object-cover"
              />
              <button
                onClick={handleCloseExpanded}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Image navigation in modal */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-12 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Image thumbnails */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${currentImageIndex === index
                      ? "border-accent"
                      : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                  >
                    <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Modal content */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-lg">{product.name}</h3>
                <p className="text-lg mt-1">
                  <span className="font-bold text-foreground">From ${product.price}</span>
                </p>
              </div>

              {/* Available sizes */}
              <div>
                <p className="text-sm font-semibold mb-2">Available Sizes</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <span
                      key={size}
                      className="px-3 py-1.5 bg-secondary text-foreground text-sm rounded-lg border border-border hover:border-accent hover:bg-accent/10 cursor-pointer transition-colors"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>

              {/* Available colors */}
              <div>
                <p className="text-sm font-semibold mb-2">Available Colors</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <div
                      key={color}
                      className="w-8 h-8 rounded-full border-2 border-border hover:border-accent cursor-pointer transition-colors"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Print method */}
              <div>
                <p className="text-sm font-semibold mb-2">Print Options</p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent text-sm rounded-lg border border-accent/30">
                  {product.printMethod}
                </span>
              </div>

              {/* Customize button */}
              <Button
                variant="green"
                size="lg"
                className="w-full gap-2"
              >
                <Palette className="w-5 h-5" />
                Customize This Product
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;