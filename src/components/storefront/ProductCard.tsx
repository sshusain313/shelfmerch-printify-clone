import { ArrowRight } from "lucide-react";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  category?: string;
}

const ProductCard = ({ name, price, image, category }: ProductCardProps) => {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);

  return (
    <article className="product-card group bg-card rounded-2xl overflow-hidden border border-border/50">
      <div className="product-image-wrapper aspect-[4/5] bg-muted">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center">
          <button className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 bg-background text-foreground px-6 py-3 rounded-full font-medium flex items-center gap-2 shadow-lg hover:bg-foreground hover:text-background">
            Quick View
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {category && (
          <span className="text-xs font-medium uppercase tracking-wider text-primary">
            {category}
          </span>
        )}
        <h3 className="font-display text-lg font-medium text-foreground leading-snug line-clamp-2">
          {name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xl font-semibold text-foreground">
            {formattedPrice}
          </span>
          <button className="btn-outline-store !px-4 !py-1.5 text-sm">
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
