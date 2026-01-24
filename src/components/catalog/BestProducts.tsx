import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  latest: string;
  price: number;
  sizes: number;
  colors: number;
  imageUrl: string;
  categoryId?: string;
  subcategoryId?: string;
  subcategoryIds?: string[];
}

// Category slug to parent category mapping (for subcategory routing)
const categorySlugToParentCategory: Record<string, string> = {
  // Apparel
  't-shirts': 'apparel',
  'tank-tops': 'apparel',
  'hoodies': 'apparel',
  'sweatshirts': 'apparel',
  'jackets': 'apparel',
  'crop-tops': 'apparel',
  'aprons': 'apparel',
  'scarves': 'apparel',
  'jerseys': 'apparel',
  'long-sleeves': 'apparel',
  'oversized': 'apparel',
  'socks': 'apparel',
  'beanies': 'apparel',

  // Accessories
  'tote-bag': 'accessories',
  'tote-bags': 'accessories',
  'caps': 'accessories',
  'phone-covers': 'accessories',
  'gaming-pads': 'accessories',
  'backpacks': 'accessories',
  'pouches': 'accessories',
  'bottles': 'accessories',
  'bracelets': 'accessories',
  'coasters': 'accessories',
  'business-cards': 'accessories',

  // Home & Living
  'cans': 'home',
  'mugs': 'home',
  'drinkware': 'home',
  'cushions': 'home',
  'frames': 'home',
  'wall-art': 'home',
  'blankets': 'home',
  'books': 'home',
  'notebooks': 'home',

  // Print
  'stickers': 'print',
  'posters': 'print',
  'flyers': 'print',
  'greeting-cards': 'print',
  'billboards': 'print',
  'magazines': 'print',
  'brochures': 'print',
  'lanyards': 'print',
  'banners': 'print',
  'canvas': 'print',
  'stationery': 'print',

  // Packaging
  'boxes': 'packaging',
  'tubes': 'packaging',
  'dropper-bottles': 'packaging',
  'cosmetics': 'packaging',

  // Tech
  'iphone-cases': 'tech',
  'laptop-skins': 'tech',
  'ipad-cases': 'tech',
  'macbook-cases': 'tech',
  'phone-cases': 'tech',
  'laptop-cases': 'tech',

  // Jewelry
  'rings': 'jewelry',
  'necklaces': 'jewelry',
  'earrings': 'jewelry',
};

/**
 * Determines the navigation route for a product based on its data
 * @param product - Product object with id, categoryId, subcategoryId
 * @returns Route path string
 */
const getProductRoute = (product: Product): string => {
  // Priority 1: If product has a valid ID, navigate to product detail page
  if (product.id && product.id.trim() !== '') {
    return `/products/${product.id}`;
  }

  // Priority 2: If product has subcategory info, navigate to subcategory page
  if (product.subcategoryId) {
    const subcategorySlug = product.subcategoryId.toLowerCase().replace(/\s+/g, '-');
    return `/products/category/${subcategorySlug}`;
  }

  // Priority 3: If product has subcategoryIds array, use first one
  if (product.subcategoryIds && product.subcategoryIds.length > 0) {
    const subcategorySlug = product.subcategoryIds[0].toLowerCase().replace(/\s+/g, '-');
    return `/products/category/${subcategorySlug}`;
  }

  // Priority 4: If product has categoryId, navigate to category subcategories page
  if (product.categoryId) {
    const categoryId = product.categoryId.toLowerCase();
    // Check if it's a main category that should go to subcategories page
    const mainCategories = ['apparel', 'accessories', 'home', 'print', 'packaging', 'tech', 'jewelry'];
    if (mainCategories.includes(categoryId)) {
      return `/products/category/${categoryId}`;
    }
    // Otherwise, navigate to category products page
    return `/products?category=${categoryId}`;
  }

  // Fallback: Navigate to products page
  return '/products';
};

interface SectionProps {
  products: Product[];
  id?: string;
}

const ProductCard = ({ product, index }: { product: Product; index: number }) => {
  const route = getProductRoute(product);

  return (
    <Link
      to={route}
      className="group relative flex-shrink-0 w-full aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl fade-in-up block cursor-pointer"
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
    </Link>
  );
};

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

const BestProducts = ({ products, id }: SectionProps) => {
  return (
    <section id={id} className="py-10 scroll-mt-24">
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

const HotNewProducts = ({ products, id }: SectionProps) => {
  return (
    <section id={id} className="py-10 scroll-mt-24">
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

const StarterEssentials = ({ products, id }: SectionProps) => {
  return (
    <section id={id} className="py-10 scroll-mt-24">
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

const ExclusiveKits = ({ products, id }: SectionProps) => {
  return (
    <section id={id} className="py-10 scroll-mt-24">
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
