import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Product, Store, CartItem } from '@/types';
import { storeApi, storeProductsApi } from '@/lib/api';
import { getTheme } from '@/lib/themes';
import SectionRenderer from '@/components/builder/SectionRenderer';
import CartDrawer from '@/components/storefront/CartDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Package,
  ShieldCheck,
  Truck,
  RefreshCcw,
} from 'lucide-react';
import { BuilderSection } from '@/types/builder';

interface ImageMagnifierProps {
  src: string;
  zoom?: number;
  alt?: string;
}

const ImageMagnifier: React.FC<ImageMagnifierProps> = ({ src, zoom = 2, alt }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [backgroundPosition, setBackgroundPosition] = useState('center');
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [spLoading, setSpLoading] = useState(false);
  const [spFilter, setSpFilter] = useState<{ status?: 'draft' | 'published'; isActive?: boolean }>({});
  const [products, setProducts] = useState<Product[]>([]);
  const { subdomain } = useParams<{ subdomain: string }>();
  const [store, setStore] = useState<Store | null>(null);

  const loadStoreData = useCallback(async () => {
    if (!subdomain) return;
    try {
      const response = await storeApi.getBySubdomain(subdomain);
      if (response && response.success && response.data) {
        setStore(response.data as Store);
      }
    } catch (err) {
      console.error('Failed to fetch store from backend:', err);
      setStore(null);
    }
  }, [subdomain]);

  useEffect(() => {
    if (!subdomain) return;

    // Simulate URL rewriting - show custom domain in address bar
    if (window.location.pathname.startsWith('/store/')) {
      const customDomain = `${subdomain}.shelfmerch.com`;
      // Update document title and meta tags
      document.title = `${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)} - ShelfMerch Store`;
      
      // You can also update the displayed URL using history API (cosmetic only)
      // Note: This won't actually change the domain, but shows the concept
      window.history.replaceState(null, '', `/store/${subdomain}`);
    }

    // Load store data
    loadStoreData();
  }, [subdomain, loadStoreData]);


  // Load store-specific products from backend (StoreProduct collection)
  useEffect(() => {
    const loadSP = async () => {
      if (!store) {
        setStoreProducts([]);
        setProducts([]);
        return;
      }
      try {
        setSpLoading(true);
        const resp = await storeProductsApi.list(spFilter);
        if (resp.success) {
          const all = resp.data || [];
          // Filter products for this specific store
          const forStore = all.filter(
            (sp: any) =>
              sp.storeId === store.id ||
              sp.storeId === store._id || // depending on serialization
              String(sp.storeId) === String(store.id)
          );
          setStoreProducts(forStore);

          // Map StoreProduct documents into frontend Product shape for rendering / cart
          const mapped: Product[] = forStore.map((sp: any) => {
            const id = sp._id?.toString?.() || sp.id;
            const basePrice: number =
              typeof sp.sellingPrice === 'number'
                ? sp.sellingPrice
                : typeof sp.price === 'number'
                ? sp.price
                : 0;

            const primaryImage =
              sp.galleryImages?.find((img: any) => img.isPrimary)?.url ||
              (Array.isArray(sp.galleryImages) && sp.galleryImages[0]?.url) ||
              undefined;

            return {
              id,
              userId: store.userId,
              name: sp.title || sp.name || 'Untitled product',
              description: sp.description,
              baseProduct: sp.catalogProductId || '',
              price: basePrice,
              compareAtPrice:
                typeof sp.compareAtPrice === 'number' ? sp.compareAtPrice : undefined,
              mockupUrl: primaryImage,
              mockupUrls: Array.isArray(sp.galleryImages)
                ? sp.galleryImages.map((img: any) => img.url).filter(Boolean)
                : [],
              designs: sp.designData?.designs || {},
              designBoundaries: sp.designData?.designBoundaries,
              variants: {
                colors: [],
                sizes: [],
              },
              createdAt: sp.createdAt || new Date().toISOString(),
              updatedAt: sp.updatedAt || new Date().toISOString(),
            };
          });

          setProducts(mapped);
        }
      } catch (e) {
        console.error('Failed to load store products', e);
        setStoreProducts([]);
        setProducts([]);
      } finally {
        setSpLoading(false);
      }
    };

    loadSP();
  }, [store, spFilter]);
  

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - left) / width) * 100;
    const y = ((event.clientY - top) / height) * 100;
    setBackgroundPosition(`${x}% ${y}%`);
  };

  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted"
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: isHovering ? `${zoom * 100}%` : 'cover',
        backgroundPosition: isHovering ? backgroundPosition : 'center',
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={handleMouseMove}
    >
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover transition-opacity duration-200 ${
          isHovering ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
};

const mockReviews = [
  {
    id: 1,
    name: 'Alex Morgan',
    rating: 5,
    date: 'October 12, 2025',
    content:
      'The print quality is outstanding and the fabric feels premium. Would definitely recommend to anyone looking for comfort and style.',
  },
  {
    id: 2,
    name: 'Priya Desai',
    rating: 4,
    date: 'October 05, 2025',
    content:
      'Loved the colors and fit. Shipping was quick too! Slightly wish there were more pastel color options.',
  },
  {
    id: 3,
    name: 'Jordan Lee',
    rating: 5,
    date: 'September 28, 2025',
    content:
      'Fits perfectly and the size guide is accurate. The design looks even better in person. Great job!'
  },
];

const defaultSizeChart = [
  { size: 'S', chest: '34" - 36"', length: '28"' },
  { size: 'M', chest: '38" - 40"', length: '29"' },
  { size: 'L', chest: '42" - 44"', length: '30"' },
  { size: 'XL', chest: '46" - 48"', length: '31"' },
  { size: '2XL', chest: '50" - 52"', length: '32"' },
];

const StoreProductPage: React.FC = () => {
  const { subdomain, productId } = useParams<{ subdomain: string; productId: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const theme = store ? getTheme(store.theme) : getTheme('modern');

  const builderSections = useMemo<BuilderSection[]>(() => {
    if (!store?.builder) return [];
    const productPage = store.builder.pages.find((page) => page.slug === '/product');
    if (!productPage) return [];
    return productPage.sections
      .filter((section) => section.visible !== false)
      .sort((a, b) => a.order - b.order);
  }, [store]);

  const similarProducts = useMemo(() => {
    return products.filter((item) => item.id !== productId).slice(0, 4);
  }, [products, productId]);

  // Load store and specific product from backend (Store + StoreProduct collections)
  useEffect(() => {
    const loadStoreAndProduct = async () => {
      if (!subdomain || !productId) return;

      try {
        // 1) Load public store by subdomain
        const storeResp = await storeApi.getBySubdomain(subdomain);
        if (!storeResp.success || !storeResp.data) {
          setStore(null);
          setProducts([]);
          setProduct(null);
          return;
        }

        const foundStore = storeResp.data as Store;
        setStore(foundStore);

        // 2) Load all published + active store products for this merchant,
        //    then filter down to this specific store.
        const spResp = await storeProductsApi.list({
          status: 'published',
          isActive: true,
        });

        if (!spResp.success) {
          setProducts([]);
          setProduct(null);
          return;
        }

        const all = spResp.data || [];
        const forStore = all.filter(
          (sp: any) =>
            sp.storeId === foundStore.id ||
            sp.storeId === (foundStore as any)._id ||
            String(sp.storeId) === String(foundStore.id)
        );

        // Map StoreProduct docs into frontend Product shape
        const mapped: Product[] = forStore.map((sp: any) => {
          const id = sp._id?.toString?.() || sp.id;
          const basePrice: number =
            typeof sp.sellingPrice === 'number'
              ? sp.sellingPrice
              : typeof sp.price === 'number'
              ? sp.price
              : 0;

          const primaryImage =
            sp.galleryImages?.find((img: any) => img.isPrimary)?.url ||
            (Array.isArray(sp.galleryImages) && sp.galleryImages[0]?.url) ||
            undefined;

          const variantsFromDesign = sp.designData?.variants as
            | { colors?: string[]; sizes?: string[] }
            | undefined;

          const colors =
            variantsFromDesign?.colors && variantsFromDesign.colors.length > 0
              ? variantsFromDesign.colors
              : ['Default'];
          const sizes =
            variantsFromDesign?.sizes && variantsFromDesign.sizes.length > 0
              ? variantsFromDesign.sizes
              : ['One Size'];

          return {
            id,
            userId: foundStore.userId,
            name: sp.title || sp.name || 'Untitled product',
            description: sp.description,
            baseProduct: sp.catalogProductId || '',
            price: basePrice,
            compareAtPrice:
              typeof sp.compareAtPrice === 'number' ? sp.compareAtPrice : undefined,
            mockupUrl: primaryImage,
            mockupUrls: Array.isArray(sp.galleryImages)
              ? sp.galleryImages.map((img: any) => img.url).filter(Boolean)
              : [],
            designs: sp.designData?.designs || {},
            designBoundaries: sp.designData?.designBoundaries,
            variants: {
              colors,
              sizes,
            },
            createdAt: sp.createdAt || new Date().toISOString(),
            updatedAt: sp.updatedAt || new Date().toISOString(),
          };
        });

        setProducts(mapped);

        // 3) Select the specific product for this page
        const currentProduct =
          mapped.find((item) => item.id === productId) ||
          null;

        setProduct(currentProduct);

        if (currentProduct) {
          const primaryMockup =
            currentProduct.mockupUrls?.[0] ||
            currentProduct.mockupUrl ||
            null;
          setActiveImage(primaryMockup);
          setSelectedColor(currentProduct.variants.colors[0] || 'Default');
          setSelectedSize(currentProduct.variants.sizes[0] || 'One Size');
        }
      } catch (err) {
        console.error('Failed to load store product page data:', err);
        setStore(null);
        setProducts([]);
        setProduct(null);
      }
    };

    loadStoreAndProduct();
  }, [subdomain, productId]);

  useEffect(() => {
    if (!store) return;
    const savedCart = sessionStorage.getItem(`cart_${store.id}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [store]);

  useEffect(() => {
    if (!store) return;
    sessionStorage.setItem(`cart_${store.id}`, JSON.stringify(cart));
  }, [cart, store]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    if (!selectedColor || !selectedSize) {
      toast.error('Please choose a color and size');
      return;
    }

    const newItem: CartItem = {
      productId: product.id,
      product,
      quantity,
      variant: { color: selectedColor, size: selectedSize },
    };

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          item.variant.color === newItem.variant.color &&
          item.variant.size === newItem.variant.size,
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        toast.success('Updated cart quantity');
        return updated;
      }

      toast.success('Added to cart');
      return [...prev, newItem];
    });
  }, [product, quantity, selectedColor, selectedSize]);

  const handleUpdateQuantity = (productIdValue: string, variant: any, nextQuantity: number) => {
    if (nextQuantity <= 0) {
      handleRemoveFromCart(productIdValue, variant);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productIdValue &&
        item.variant.color === variant.color &&
        item.variant.size === variant.size
          ? { ...item, quantity: nextQuantity }
          : item,
      ),
    );
  };

  const handleRemoveFromCart = (productIdValue: string, variant: any) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(
            item.productId === productIdValue &&
            item.variant.color === variant.color &&
            item.variant.size === variant.size
          ),
      ),
    );
  };

  const handleCheckout = () => {
    if (!store) return;
    navigate(`/store/${store.subdomain}/checkout`);
  };

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <h1 className="text-3xl font-bold mb-3">Store not found</h1>
        <p className="text-muted-foreground mb-6">
          The store you are looking for is unavailable or has not been published yet.
        </p>
        <Button asChild>
          <Link to="/">Go back to ShelfMerch</Link>
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <h1 className="text-3xl font-bold mb-3">Product not available</h1>
        <p className="text-muted-foreground mb-6">
          This product might have been removed or is no longer available.
        </p>
        <Button onClick={() => navigate(`/store/${store.subdomain}`)}>Back to store</Button>
      </div>
    );
  }

  const galleryImages =
    product.mockupUrls && product.mockupUrls.length > 0
      ? product.mockupUrls
      : product.mockupUrl
      ? [product.mockupUrl]
      : [];

  const renderTrustBadgeIcon = (icon?: string) => {
    switch (icon) {
      case 'ShieldCheck':
        return <ShieldCheck className="h-4 w-4" />;
      case 'Truck':
      default:
        return <Truck className="h-4 w-4" />;
    }
  };

  const renderReviewsSection = () => (
    <section id="reviews" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: theme.fonts.heading }}>
          Customer reviews
        </h2>
        <p className="text-muted-foreground text-sm">
          Real feedback from shoppers who purchased this product.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {mockReviews.map((review) => (
          <Card key={review.id} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{review.name}</p>
                <p className="text-xs text-muted-foreground">{review.date}</p>
              </div>
              <div className="flex items-center gap-1 text-yellow-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={`${review.id}-star-${index}`} className={`h-4 w-4 ${index < review.rating ? 'fill-current' : 'text-muted-foreground'}`} />
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
          </Card>
        ))}
      </div>
    </section>
  );

  const renderSizeChartSection = () => (
    <section id="size-chart" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold" style={{ fontFamily: theme.fonts.heading }}>
          Size chart
        </h2>
        <p className="text-muted-foreground text-sm">Compare measurements to find your ideal fit.</p>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Size</th>
              <th className="px-4 py-3 text-left font-semibold">Chest</th>
              <th className="px-4 py-3 text-left font-semibold">Length</th>
            </tr>
          </thead>
          <tbody>
            {defaultSizeChart.map((row) => (
              <tr key={row.size} className="border-t">
                <td className="px-4 py-3 font-medium">{row.size}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.chest}</td>
                <td className="px-4 py-3 text-muted-foreground">{row.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const navLinks: Array<{ id: string; label: string }> = [];
  const ensureNavLink = (id: string, label: string) => {
    if (!navLinks.some((link) => link.id === id)) {
      navLinks.push({ id, label });
    }
  };

  const contentSections: React.ReactNode[] = [];
  let hasProductDetailsSection = false;
  let hasRecommendationsSection = false;
  let hasAnnouncementBar = false;

  const handleProductClick = (nextProduct: Product) => {
    if (!store) return;
    navigate(`/store/${store.subdomain}/product/${nextProduct.id}`);
  };

  const appendProductDetailsSection = (settings?: Record<string, any>) => {
    hasProductDetailsSection = true;
    ensureNavLink('details', 'Details');

    const showBadge = settings?.showBadge ?? true;
    const badgeText = settings?.badgeText || 'Bestseller';
    const showRating = settings?.showRating ?? true;
    const ratingValue = settings?.ratingValue ?? 4.8;
    const ratingCount = settings?.ratingCount ?? 128;
    const tagline = settings?.tagline;
    const showTrustBadges = settings?.showTrustBadges ?? true;
    const trustBadges = Array.isArray(settings?.trustBadges) && settings?.trustBadges.length > 0
      ? settings.trustBadges
      : [
          { icon: 'Truck', title: 'Fast fulfillment', text: 'Ships in 2-3 business days' },
          { icon: 'ShieldCheck', title: 'Quality guarantee', text: '30-day hassle-free returns' },
        ];
    const showReviews = settings?.showReviews ?? true;
    const showSizeChart = settings?.showSizeChart ?? true;

    if (showReviews) ensureNavLink('reviews', 'Reviews');
    if (showSizeChart) ensureNavLink('size-chart', 'Size chart');

    contentSections.push(
      <section key="product-details" id="details" className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          {galleryImages.length > 0 ? (
            <>
              <ImageMagnifier src={activeImage || galleryImages[0]} alt={product.name} />
              {galleryImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {galleryImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(image)}
                      className={`rounded-lg border transition-all ${
                        activeImage === image ? 'border-primary ring-2 ring-primary/30' : 'border-muted'
                      }`}
                    >
                      <img src={image} alt={`${product.name} mockup ${index + 1}`} className="aspect-square w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-muted-foreground/40">
              <Package className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {showBadge && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {badgeText}
                </Badge>
              )}
              {showRating && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span>{ratingValue}</span>
                  <span>({ratingCount} reviews)</span>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold" style={{ fontFamily: theme.fonts.heading }}>
              {product.name}
            </h1>
            {tagline && <p className="text-sm text-muted-foreground">{tagline}</p>}
            {product.description && (
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <p className="text-3xl font-semibold" style={{ color: theme.colors.primary }}>
              ${product.price.toFixed(2)}
            </p>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <p className="text-lg text-muted-foreground line-through">
                ${product.compareAtPrice.toFixed(2)}
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.colors.map((color) => (
                  <Button
                    key={color}
                    variant={selectedColor === color ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.sizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? 'default' : 'outline'}
                    size="sm"
                    className="min-w-[56px]"
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantity
              </label>
              <div className="inline-flex items-center rounded-lg border">
                <button
                  type="button"
                  className="px-3 py-2 text-lg"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-medium">{quantity}</span>
                <button
                  type="button"
                  className="px-3 py-2 text-lg"
                  onClick={() => setQuantity((prev) => prev + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="flex-1" onClick={handleAddToCart}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to cart
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                handleAddToCart();
                handleCheckout();
              }}
            >
              Buy it now
            </Button>
          </div>

          {showTrustBadges && (
            <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
              {trustBadges.slice(0, 3).map((badge: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    {renderTrustBadgeIcon(badge.icon)}
                  </div>
                  <div>
                    <p className="font-medium">{badge.title || 'Trust badge title'}</p>
                    <p className="text-muted-foreground">
                      {badge.text || 'Share fulfillment, quality, or return guarantees here.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>,
    );

    if (showReviews) {
      contentSections.push(renderReviewsSection());
    }

    if (showSizeChart) {
      contentSections.push(renderSizeChartSection());
    }
  };

  const appendRecommendationsSection = (section?: BuilderSection) => {
    hasRecommendationsSection = true;
    const heading = section?.settings?.heading || 'You may also like';
    const subheading =
      section?.settings?.subheading || 'Explore more designs that pair perfectly with this product.';
    const layout = section?.settings?.layout || 'grid';
    const gridClass =
      layout === 'list'
        ? 'grid gap-6 sm:grid-cols-1'
        : 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4';

    contentSections.push(
      <section key={section?.id || 'recommendations'} className="space-y-6" id="similar">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold" style={{ fontFamily: theme.fonts.heading }}>
              {heading}
            </h2>
            <p className="text-muted-foreground text-sm">{subheading}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/store/${store.subdomain}#products`)}>
            View all products
          </Button>
        </div>
        <div className={gridClass}>
          {similarProducts.map((item) => {
            const preview = item.mockupUrls?.[0] || item.mockupUrl;
            return (
              <Card key={item.id} className="overflow-hidden">
                <Link to={`/store/${store.subdomain}/product/${item.id}`}>
                  <div className="aspect-square overflow-hidden bg-muted">
                    {preview ? (
                      <img
                        src={preview}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Package className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-medium line-clamp-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">From ${item.price.toFixed(2)}</p>
                  </div>
                </Link>
              </Card>
            );
          })}
          {similarProducts.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              <p>No similar products yet. Check back soon!</p>
            </Card>
          )}
        </div>
      </section>,
    );
  };

  const appendAnnouncementBar = (section: BuilderSection) => {
    hasAnnouncementBar = true;
    contentSections.unshift(
      <section key={section.id} className="bg-primary/10 text-primary">
        <div className="container mx-auto flex flex-col items-center justify-center gap-2 px-4 py-3 text-sm md:flex-row">
          <span className="font-medium">{section.settings.message || 'Free shipping on orders over $75'}</span>
          {section.settings.linkLabel && section.settings.linkUrl && (
            <Button size="sm" variant="secondary" asChild>
              <a href={section.settings.linkUrl}>{section.settings.linkLabel}</a>
            </Button>
          )}
        </div>
      </section>,
    );
  };

  const appendAdditionalSection = (section: BuilderSection) => {
    contentSections.push(
      <SectionRenderer
        key={section.id}
        section={section}
        products={products}
        globalStyles={store.builder?.globalStyles}
        onProductClick={handleProductClick}
      />,
    );
  };

  if (builderSections.length > 0) {
    builderSections.forEach((section) => {
      switch (section.type) {
        case 'announcement-bar':
          appendAnnouncementBar(section);
          break;
        case 'product-details':
          appendProductDetailsSection(section.settings);
          break;
        case 'product-recommendations':
          appendRecommendationsSection(section);
          break;
        default:
          appendAdditionalSection(section);
          break;
      }
    });
  }

  if (!hasProductDetailsSection) {
    appendProductDetailsSection();
  }

  if (!hasRecommendationsSection) {
    appendRecommendationsSection();
  }

  if (!hasAnnouncementBar && builderSections.length === 0) {
    ensureNavLink('details', 'Details');
  }

  if (!navLinks.some((link) => link.id === 'details')) {
    ensureNavLink('details', 'Details');
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: theme.fonts.body }}>
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to={`/store/${store.subdomain}`} className="text-2xl font-semibold" style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}>
              {store.storeName}
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <Link to={`/store/${store.subdomain}`} className="hover:text-primary transition-colors">
                Home
              </Link>
              {navLinks.map((link) => (
                <a key={link.id} href={`#${link.id}`} className="hover:text-primary transition-colors">
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate(`/store/${store.subdomain}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to store
            </Button>
            <Button variant="ghost" size="icon" className="relative" onClick={() => setCartOpen(true)}>
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-16">
        {contentSections.map((node, index) => (
          <React.Fragment key={index}>{node}</React.Fragment>
        ))}
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {store.storeName}. Powered by{' '}
          <Link to="/" className="text-primary hover:underline">
            ShelfMerch
          </Link>
        </div>
      </footer>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckout}
      />
    </div>
  );
};

export default StoreProductPage;
