import { ArrowRight } from "lucide-react";

interface Product {
  id: string;
  name: string;
  latest: string;
  price: number;
  sizes: number;
  colors: number;
  imageUrl: string;
}

interface SectionProps {
  products: Product[];
}

const ProductCard = ({ product, index }: { product: Product; index: number }) => (
  <div
    className="group relative flex-shrink-0 w-full aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl fade-in-up"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    <img
      src={product.imageUrl}
      alt={product.name}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
    />
    {/* Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

    {/* Content */}
    <div className="absolute bottom-4 left-4 right-4 text-left text-white">
      <h3 className="font-bold text-lg mb-1 leading-tight line-clamp-2 drop-shadow-md">
        {product.latest}
      </h3>
      <p className="font-medium text-sm text-white/90 drop-shadow-md">
        From ${product.price.toFixed(2)}
      </p>
      <p className="text-xs text-white/70 mt-1 drop-shadow-md">
        {product.sizes} {product.sizes === 1 ? 'size' : 'sizes'} · {product.colors} {product.colors === 1 ? 'color' : 'colors'}
      </p>
    </div>
  </div>
);

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-foreground">
        {title}
      </h2>
      <p className="text-muted-foreground mt-1">
        {description}
      </p>
    </div>
    <button className="hidden sm:flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all">
      <span>Show All</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);

const MobileShowAll = () => (
  <div className="sm:hidden mt-6 text-center">
    <button className="inline-flex items-center gap-1 text-primary font-medium">
      <span>Show All</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);

const BestProducts = ({ products }: SectionProps) => {
  return (
    <section className="py-10">
      <SectionHeader
        title="Explore ShelfMerch's Best"
        description="Here are some of the most popular product categories in our catalog."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
      <MobileShowAll />
    </section>
  );
};

const HotNewProducts = ({ products }: SectionProps) => {
  return (
    <section className="py-10">
      <SectionHeader
        title="Hot New Products"
        description="Get ahead of the game with our newest offering of products that just hit our catalog."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
      <MobileShowAll />
    </section>
  );
};

const StarterEssentials = ({ products }: SectionProps) => {
  return (
    <section className="py-10">
      <SectionHeader
        title="Starter Essentials"
        description="Perfect for beginners - essential products to kickstart your custom merchandise journey."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
      <MobileShowAll />
    </section>
  );
};

const ExclusiveKits = ({ products }: SectionProps) => {
  return (
    <section className="py-10">
      <SectionHeader
        title="Exclusive Kits"
        description="Curated product bundles designed for maximum impact and convenience."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
      <MobileShowAll />
    </section>
  );
};

export default BestProducts;
export { HotNewProducts, StarterEssentials, ExclusiveKits };
