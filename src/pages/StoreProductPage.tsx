import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { getTenantSlugFromLocation } from '@/utils/tenantUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  ArrowLeft,
  Check,
  Truck,
  Shield,
  RefreshCw,
  Clock,
  Award,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Minus,
  Plus,
  Home,
  Package,
  Zap,
  Menu
} from 'lucide-react';
import { Product, Store, CartItem } from '@/types';
import { storeApi, storeProductsApi } from '@/lib/api';
import { getTheme } from '@/lib/themes';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { toast } from 'sonner';
import CartDrawer from '@/components/storefront/CartDrawer';
import SectionRenderer from '@/components/builder/SectionRenderer';
import { BuilderSection } from '@/types/builder';
import ImageMagnifier from '@/components/storefront/ImageMagnifier';
import { cn } from '@/lib/utils';
import ReviewsSection from '@/components/reviews/ReviewsSection';

const mockReviews = [
  {
    id: 1,
    name: 'Alex Morgan',
    date: 'October 12, 2025',
    rating: 5,
    content: 'The print quality is outstanding and the fabric feels premium. Would definitely recommend to anyone looking for comfort and style.',
    avatar: 'AM',
    verified: true
  },
  {
    id: 2,
    name: 'Priya Desai',
    date: 'October 05, 2025',
    rating: 4,
    content: 'Loved the colors and fit. Shipping was quick too! Slightly wish there were more pastel color options.',
    avatar: 'PD',
    verified: true
  },
  {
    id: 3,
    name: 'Jordan Lee',
    date: 'September 28, 2025',
    rating: 5,
    content: 'Fits perfectly and the size guide is accurate. The design looks even better in person. Great job!',
    avatar: 'JL',
    verified: false
  }
];

const defaultSizeChart = [
  { size: 'S', chest: '34" - 36"', length: '28"', shoulder: '16"' },
  { size: 'M', chest: '38" - 40"', length: '29"', shoulder: '17"' },
  { size: 'L', chest: '42" - 44"', length: '30"', shoulder: '18"' },
  { size: 'XL', chest: '46" - 48"', length: '31"', shoulder: '19"' },
  { size: '2XL', chest: '50" - 52"', length: '32"', shoulder: '20"' },
];

const StoreProductPage = () => {
  const params = useParams<{ subdomain: string; productId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get tenant slug from subdomain (hostname) or path parameter (fallback)
  const subdomain = getTenantSlugFromLocation(location, params) || params.subdomain;
  const productId = params.productId;
  const [store, setStore] = useState<Store | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const [variantPriceMap, setVariantPriceMap] = useState<Record<string, Record<string, number>>>({});
  const [colorHexMap, setColorHexMap] = useState<Record<string, string>>({});
  // Track which sizes are available for each color
  const [colorToSizesMap, setColorToSizesMap] = useState<Record<string, Set<string>>>({});
  // Track which colors are available for each size
  const [sizeToColorsMap, setSizeToColorsMap] = useState<Record<string, Set<string>>>({});

  const theme = store ? getTheme(store.theme) : getTheme('modern');

  const builderSections = useMemo<BuilderSection[]>(() => {
    if (!store?.builder) return [];
    const productPage = store.builder.pages.find((page) =>
      page.id === 'product' ||
      page.slug === '/product' ||
      page.slug === 'product'
    );
    if (!productPage) {
      console.warn('Product page configuration not found in builder');
      return [];
    }
    return productPage.sections
      .filter((section) => section.visible !== false)
      .sort((a, b) => a.order - b.order);
  }, [store]);

  // Check if using builder for product page
  const usingBuilder = store?.useBuilder && builderSections.length > 0;
  const hasBuilderHeader = builderSections.some((s) => s.type === 'header');
  const hasBuilderAnnouncement = builderSections.some((s) => s.type === 'announcement-bar');
  const hasBuilderFooter = builderSections.some((s) => s.type === 'footer');
  const recommendationsSection = builderSections.find((s) => s.type === 'product-recommendations');

  const similarProducts = useMemo(() => {
    return products.filter((item) => item.id !== productId).slice(0, 4);
  }, [products, productId]);

  // Track scroll for sticky bar
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load store and specific product from backend
  useEffect(() => {
    const loadStoreAndProduct = async () => {
      if (!subdomain || !productId) return;
      setIsLoading(true);

      try {
        const storeResp = await storeApi.getBySubdomain(subdomain);
        if (!storeResp.success || !storeResp.data) {
          setStore(null);
          setProducts([]);
          setProduct(null);
          setIsLoading(false);
          return;
        }

        const foundStore = storeResp.data as Store;
        setStore(foundStore);

        const spResp = await storeProductsApi.listPublic(foundStore.id);

        if (!spResp.success) {
          setProducts([]);
        } else {
          const forStore = spResp.data || [];

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

            const colors =
              sp.designData?.selectedColors && sp.designData.selectedColors.length > 0
                ? sp.designData.selectedColors
                : ['Default'];
            const sizes =
              sp.designData?.selectedSizes && sp.designData.selectedSizes.length > 0
                ? sp.designData.selectedSizes
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
              mockupUrls: Array.isArray(sp.previewImagesUrl)
                ? sp.previewImagesUrl.map((img: any) => img.url).filter(Boolean)
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
        }

        try {
          // Use store.id if available, otherwise backend will extract from subdomain (Host header)
          const publicResp = await storeProductsApi.getPublic(
            (foundStore as any).id || (foundStore as any)._id,
            productId,
          );

          if (!publicResp.success || !publicResp.data) {
            setProduct(null);
            setIsLoading(false);
            return;
          }

          const sp = publicResp.data as any;

          const basePrice: number =
            typeof sp.sellingPrice === 'number'
              ? sp.sellingPrice
              : typeof sp.price === 'number'
                ? sp.price
                : 0;

          const primaryImage =
            sp.previewImagesUrl?.find((img: any) => img.isPrimary)?.url ||
            (Array.isArray(sp.previewImagesUrl) && sp.previewImagesUrl[0]?.url) ||
            undefined;

          // Read variants from API response
          // Backend returns populated StoreProductVariant documents in sp.variants array
          // Each variant has: { catalogProductVariantId: { size, color, colorHex, ... }, sellingPrice, sku, ... }
          // Only active variants (isActive: true) are returned by the backend
          const variantDocs: any[] = Array.isArray(sp.variants) 
            ? sp.variants 
            : Array.isArray(sp.variantsSummary)
              ? sp.variantsSummary
              : [];
          
          const colorSet = new Set<string>();
          const sizeSet = new Set<string>();
          const priceMap: Record<string, Record<string, number>> = {};
          const hexMap: Record<string, string> = {};
          // Track which color/size combinations are available
          const availabilityMap: Record<string, Set<string>> = {}; // color -> Set of sizes
          const sizeToColorsMap: Record<string, Set<string>> = {}; // size -> Set of colors

          variantDocs.forEach((v) => {
            // Handle populated StoreProductVariant structure
            // v.catalogProductVariantId is populated with { size, color, colorHex, ... }
            const cv = v.catalogProductVariantId || {};

            // Extract color: from populated catalogProductVariantId or direct field
            const color = typeof v.color === 'string'
              ? v.color
              : typeof cv.color === 'string'
                ? cv.color
                : undefined;
            
            // Extract size: from populated catalogProductVariantId or direct field
            const size = typeof v.size === 'string'
              ? v.size
              : typeof cv.size === 'string'
                ? cv.size
                : undefined;
            
            if (!color || !size) {
              console.warn('Variant missing color or size:', v);
              return;
            }

            // Extract colorHex: from populated catalogProductVariantId or direct field
            const colorHex = typeof v.colorHex === 'string'
              ? v.colorHex
              : typeof cv.colorHex === 'string'
                ? cv.colorHex
                : undefined;

            if (colorHex) {
              hexMap[color] = colorHex;
            }

            // Extract sellingPrice: prefer variant-specific price, fallback to base price
            const variantPrice: number =
              typeof v.sellingPrice === 'number' && v.sellingPrice > 0
                ? v.sellingPrice
                : basePrice;

            // Track available combinations
            colorSet.add(color);
            sizeSet.add(size);
            
            if (!availabilityMap[color]) availabilityMap[color] = new Set();
            availabilityMap[color].add(size);
            
            if (!sizeToColorsMap[size]) sizeToColorsMap[size] = new Set();
            sizeToColorsMap[size].add(color);

            if (!priceMap[color]) priceMap[color] = {};
            priceMap[color][size] = variantPrice;
          });

          setColorHexMap(hexMap);
          setColorToSizesMap(availabilityMap);
          setSizeToColorsMap(sizeToColorsMap);

          // Only include colors and sizes that have at least one available variant
          const colors = Array.from(colorSet.values());
          const sizes = Array.from(sizeSet.values());

          const currentProduct: Product = {
            id: sp._id?.toString?.() || sp.id,
            userId: foundStore.userId,
            name: sp.title || sp.name || 'Untitled product',
            description: sp.description,
            baseProduct: sp.catalogProductId || '',
            price: basePrice,
            compareAtPrice:
              typeof sp.compareAtPrice === 'number' ? sp.compareAtPrice : undefined,
            mockupUrl: primaryImage,
            mockupUrls: (() => {
              const previewImagesByView = sp.designData?.previewImagesByView || sp.previewImagesByView || {};
              const previewImageUrls = Object.values(previewImagesByView).filter((url): url is string =>
                typeof url === 'string' && url.length > 0
              );

              if (previewImageUrls.length > 0) {
                return previewImageUrls;
              }

              if (Array.isArray(sp.previewImagesUrl)) {
                return sp.previewImagesUrl.map((img: any) => img.url || img).filter(Boolean);
              }

              if (Array.isArray(sp.galleryImages)) {
                return sp.galleryImages.map((img: any) => img.url || img).filter(Boolean);
              }

              return [];
            })(),
            designs: sp.designData?.designs || {},
            designBoundaries: sp.designData?.designBoundaries,
            variants: {
              colors: colors.length ? colors : ['Default'],
              sizes: sizes.length ? sizes : ['One Size'],
            },
            createdAt: sp.createdAt || new Date().toISOString(),
            updatedAt: sp.updatedAt || new Date().toISOString(),
          };

          setProduct(currentProduct);
          setVariantPriceMap(priceMap);

          const primaryMockup =
            currentProduct.mockupUrls?.[0] ||
            currentProduct.mockupUrl ||
            null;
          setActiveImage(primaryMockup);
          setActiveImageIndex(0);
          setSelectedColor(currentProduct.variants.colors[0] || 'Default');
          setSelectedSize(currentProduct.variants.sizes[0] || 'One Size');
        } catch (err) {
          console.error('Failed to load public store product with variants:', err);
          setProduct(null);
        }
      } catch (err) {
        console.error('Failed to load store product page data:', err);
        setStore(null);
        setProducts([]);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoreAndProduct();
  }, [subdomain, productId]);

  const effectivePrice = useMemo(() => {
    if (!product) return 0;
    const colorMap = variantPriceMap[selectedColor];
    const specific = colorMap?.[selectedSize];
    return typeof specific === 'number' ? specific : product.price;
  }, [product, variantPriceMap, selectedColor, selectedSize]);

  // Get available sizes for the selected color (based on actual variants in database)
  const availableSizes = useMemo(() => {
    if (!selectedColor) return [];
    const sizesForColor = colorToSizesMap[selectedColor];
    if (!sizesForColor || sizesForColor.size === 0) return [];
    return Array.from(sizesForColor).sort();
  }, [selectedColor, colorToSizesMap]);

  // Get available colors for the selected size (based on actual variants in database)
  const availableColors = useMemo(() => {
    if (!selectedSize) return product?.variants.colors || [];
    const colorsForSize = sizeToColorsMap[selectedSize];
    if (!colorsForSize || colorsForSize.size === 0) return product?.variants.colors || [];
    return Array.from(colorsForSize).sort();
  }, [selectedSize, sizeToColorsMap, product]);

  // Update selected size when color changes (ensure size is available for new color)
  useEffect(() => {
    if (!selectedColor) return;
    const sizesForColor = colorToSizesMap[selectedColor];
    if (!sizesForColor || sizesForColor.size === 0) {
      setSelectedSize('');
      return;
    }
    const availableSizesArray = Array.from(sizesForColor);
    if (selectedSize && sizesForColor.has(selectedSize)) {
      // Current size is still available for this color, keep it
      return;
    }
    // Current size is not available for this color, select first available
    if (availableSizesArray.length > 0) {
      setSelectedSize(availableSizesArray[0]);
    } else {
      setSelectedSize('');
    }
  }, [selectedColor, colorToSizesMap, selectedSize]);

  // Update selected color when size changes (ensure color is available for new size)
  useEffect(() => {
    if (!selectedSize) return;
    const colorsForSize = sizeToColorsMap[selectedSize];
    if (!colorsForSize || colorsForSize.size === 0) {
      // If no colors available for this size, don't change color (let user choose)
      return;
    }
    const availableColorsArray = Array.from(colorsForSize);
    if (selectedColor && colorsForSize.has(selectedColor)) {
      // Current color is still available for this size, keep it
      return;
    }
    // Current color is not available for this size, select first available
    if (availableColorsArray.length > 0) {
      setSelectedColor(availableColorsArray[0]);
    }
  }, [selectedSize, sizeToColorsMap, selectedColor]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    if (!selectedColor || !selectedSize) {
      toast.error('Please choose a color and size');
      return;
    }

    const colorMap = variantPriceMap[selectedColor];
    const unitPrice =
      (colorMap && typeof colorMap[selectedSize] === 'number'
        ? colorMap[selectedSize]
        : product.price);

    const newItem: CartItem = {
      productId: product.id,
      product: { ...product, price: unitPrice },
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
  }, [product, quantity, selectedColor, selectedSize, variantPriceMap]);

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

  const { isAuthenticated } = useStoreAuth();

  const galleryImages = useMemo(() => {
    if (!product) return [];
    return product.mockupUrls && product.mockupUrls.length > 0
      ? product.mockupUrls
      : product.mockupUrl
        ? [product.mockupUrl]
        : [];
  }, [product?.mockupUrls, product?.mockupUrl]);

  useEffect(() => {
    if (galleryImages.length > 0 && activeImageIndex >= 0 && activeImageIndex < galleryImages.length) {
      setActiveImage(galleryImages[activeImageIndex]);
    }
  }, [activeImageIndex, galleryImages]);

  const nextImage = useCallback(() => {
    if (!galleryImages.length) return;
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  }, [galleryImages.length]);

  const prevImage = useCallback(() => {
    if (!galleryImages.length) return;
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  const getColorHex = useCallback((colorName: string): string => {
    return colorHexMap[colorName] || '#E8DDD4';
  }, [colorHexMap]);

  const handleCheckout = () => {
    if (!store) return;
    if (!isAuthenticated) {
      navigate(`/store/${store.subdomain}/auth?redirect=checkout`, {
        state: { cart, storeId: store.id, subdomain: store.subdomain },
      });
      return;
    }
    navigate(`/store/${store.subdomain}/checkout`, {
      state: { cart, storeId: store.id, subdomain: store.subdomain },
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          url,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const discountPercentage = useMemo(() => {
    if (!product?.compareAtPrice || product.compareAtPrice <= effectivePrice) return 0;
    return Math.round((1 - effectivePrice / product.compareAtPrice) * 100);
  }, [product?.compareAtPrice, effectivePrice]);

  const renderTrustBadgeIcon = (icon?: string) => {
    switch (icon) {
      case 'ShieldCheck':
      case 'Shield':
        return <Shield className="h-5 w-5" />;
      case 'Truck':
        return <Truck className="h-5 w-5" />;
      default:
        return <Truck className="h-5 w-5" />;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Loading product...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <Package className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Store not found</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          The store you are looking for is unavailable or has not been published yet.
        </p>
        <Button asChild size="lg">
          <Link to="/">Go back to ShelfMerch</Link>
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
          <Package className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Product not available</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          This product might have been removed or is no longer available.
        </p>
        <Button size="lg" onClick={() => navigate(`/store/${store.subdomain}`)}>
          Back to store
        </Button>
      </div>
    );
  }

  // Render main product details content (Image Gallery + Info + Tabs)
  const renderProductDetails = () => (
    <div className="grid gap-8 lg:gap-12 lg:grid-cols-2 mb-16">
      {/* Image Gallery */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-square bg-gradient-to-br from-muted/50 to-muted rounded-2xl border overflow-hidden group">
          {galleryImages.length > 0 ? (
            <>
              <ImageMagnifier src={galleryImages[activeImageIndex] || galleryImages[0]} alt={product.name} />

              {/* Navigation Arrows */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-background/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-background hover:scale-105 border"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-background/90 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-background hover:scale-105 border"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discountPercentage > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground shadow-lg">
                    -{discountPercentage}% OFF
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-primary/10 text-primary backdrop-blur-sm shadow-lg">
                  <Zap className="w-3 h-3 mr-1" />
                  Bestseller
                </Badge>
              </div>

              {/* Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={cn(
                    "p-2.5 rounded-full shadow-lg transition-all hover:scale-105 border",
                    isWishlisted
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-background/90 backdrop-blur-sm hover:bg-background'
                  )}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={cn("w-5 h-5", isWishlisted && 'fill-current')} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2.5 bg-background/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-background transition-all hover:scale-105 border"
                  aria-label="Share product"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Image Counter */}
              {galleryImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium shadow-lg border">
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-24 h-24 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {galleryImages.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {galleryImages.map((image, index) => (
              <button
                key={`thumb-${index}`}
                onClick={() => setActiveImageIndex(index)}
                className={cn(
                  "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                  activeImageIndex === index
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <img
                  src={image}
                  alt={`${product.name} view ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {activeImageIndex === index && (
                  <div className="absolute inset-0 bg-primary/10" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-4 h-4",
                    star <= 4 ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">4.8 (128 reviews)</span>
          </div>

          <h1
            className="text-3xl lg:text-4xl font-bold tracking-tight"
            style={{ fontFamily: theme.fonts.heading }}
          >
            {product.name}
          </h1>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span
            className="text-3xl font-bold"
            style={{ color: theme.colors.primary }}
          >
            ${effectivePrice.toFixed(2)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > effectivePrice && (
            <>
              <span className="text-xl text-muted-foreground line-through">
                ${product.compareAtPrice.toFixed(2)}
              </span>
              <Badge variant="destructive" className="font-semibold">
                Save ${(product.compareAtPrice - effectivePrice).toFixed(2)}
              </Badge>
            </>
          )}
        </div>

        <Separator />

        {/* Variants */}
        <div className="space-y-5">
          {/* Color Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Color</label>
              <span className="text-sm text-muted-foreground">{selectedColor}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.variants.colors.map((color) => {
                const hex = getColorHex(color);
                const isSelected = selectedColor === color;
                // Check if this color is available for the selected size (or any size if no size selected)
                const isAvailable = selectedSize 
                  ? sizeToColorsMap[selectedSize]?.has(color) ?? false
                  : colorToSizesMap[color]?.size > 0;
                const isDisabled = !isAvailable;
                
                return (
                  <button
                    key={color}
                    onClick={() => {
                      if (isAvailable) {
                        setSelectedColor(color);
                      }
                    }}
                    disabled={isDisabled}
                    className={cn(
                      "relative w-10 h-10 rounded-full border-2 transition-all",
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed grayscale'
                        : isSelected
                          ? 'border-primary ring-2 ring-primary/30 hover:scale-110'
                          : 'border-border hover:border-primary/50 hover:scale-110'
                    )}
                    style={{ backgroundColor: hex }}
                    title={isDisabled ? `${color} - Not available for selected size` : color}
                    aria-label={isDisabled ? `${color} color (not available)` : `Select ${color} color`}
                  >
                    {isSelected && (
                      <Check
                        className={cn(
                          "w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                          ["White", "Cream", "Beige", "Yellow"].includes(color) ? "text-black" : "text-white"
                        )}
                        strokeWidth={3}
                      />
                    )}
                    {isDisabled && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">×</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Size</label>
              <button
                className="text-sm text-primary hover:underline flex items-center gap-1"
                onClick={() => {
                  /* Logic to open size chart modal could go here */
                }}
              >
                Size Guide
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            {availableSizes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "min-w-[3rem] px-3 py-2 rounded-md border text-sm font-medium transition-all",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border hover:border-primary/50 hover:bg-accent"
                      )}
                      title={size}
                      aria-label={`Select ${size} size`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {selectedColor 
                  ? `No sizes available for ${selectedColor}`
                  : 'No sizes available'}
              </p>
            )}
          </div>
        </div>

        {/* Quantity & Add to Cart */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">Quantity</label>
            <div className="flex items-center border rounded-md">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              size="lg"
              className="flex-1 text-base font-semibold shadow-md active:scale-[0.98] transition-all"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 text-base font-semibold border-2 hover:bg-accent/50"
              onClick={handleCheckout}
            >
              Buy it now
            </Button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid gap-3 pt-6">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
            <div className="p-2 bg-background rounded-full shadow-sm">
              <Truck className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Fast Fulfillment</p>
              <p className="text-xs text-muted-foreground">Ships in 2-3 business days</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
            <div className="p-2 bg-background rounded-full shadow-sm">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Quality Guarantee</p>
              <p className="text-xs text-muted-foreground">30-day hassle-free returns</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render product recommendations
  const renderRecommendations = (heading?: string, subheading?: string) => (
    <>
      {similarProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ fontFamily: theme.fonts.heading }}
              >
                {heading || 'You May Also Like'}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {subheading || 'Explore more designs that pair perfectly with this product.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/store/${store.subdomain}#products`)}
              className="hidden sm:flex"
            >
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similarProducts.map((item) => {
              const preview = item.mockupUrls?.[0] || item.mockupUrl;
              return (
                <Link
                  key={item.id}
                  to={`/store/${store.subdomain}/product/${item.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden border-0 shadow-sm hover:shadow-lg transition-shadow">
                    <div className="aspect-square overflow-hidden bg-muted">
                      {preview ? (
                        <img
                          src={preview}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <Package className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-1">
                      <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-sm font-semibold" style={{ color: theme.colors.primary }}>
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );

  const renderHeader = (section?: BuilderSection) => {
    const headerStyle = section ? {
      backgroundColor: section.styles?.backgroundColor,
      color: section.styles?.color || section.styles?.textColor,
    } : undefined;

    return (
      <header
        className={cn(
          "border-b sticky top-0 z-50",
          !section?.styles?.backgroundColor && "bg-background/80 backdrop-blur-md"
        )}
        style={headerStyle}
      >
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to={`/store/${store.subdomain}`}
              className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
              style={{
                color: section?.styles?.color || theme.colors.primary,
                fontFamily: theme.fonts.heading
              }}
            >
              {section?.settings?.storeName || store.storeName}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/store/${store.subdomain}`)}
              className="hidden sm:flex"
              style={{ color: section?.styles?.color }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setCartOpen(true)}
              style={{ color: section?.styles?.color }}
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium animate-scale-in">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>
    );
  };

  const renderFooter = (section?: BuilderSection) => {
    const footerStyle = section ? {
      backgroundColor: section.styles?.backgroundColor,
      color: section.styles?.color || section.styles?.textColor,
      paddingTop: section.styles?.padding?.top,
      paddingBottom: section.styles?.padding?.bottom,
    } : undefined;

    return (
      <footer
        className={cn(
          "border-t mt-16",
          !section?.styles?.backgroundColor && "bg-muted/30 py-8"
        )}
        style={footerStyle}
      >
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground" style={{ color: section?.styles?.color ? 'inherit' : undefined }}>
          {section?.settings?.copyright || (
            <>
              © {new Date().getFullYear()} {store.storeName}. Powered by{' '}
              <Link to="/" className="text-primary hover:underline font-medium">
                ShelfMerch
              </Link>
            </>
          )}
        </div>
      </footer>
    );
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: theme.fonts.body }}>
      {/* Builder Layout */}
      {usingBuilder ? (
        <div>
          {builderSections.map((section) => {
            if (section.type === 'header') {
              return (
                <div key={section.id}>
                  {renderHeader(section)}
                </div>
              );
            }
            if (section.type === 'announcement-bar') {
              return (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  products={products}
                  globalStyles={store.builder?.globalStyles}
                  isPreview={false}
                />
              );
            }
            if (section.type === 'product-details') {
              return (
                <div key={section.id}>
                  {/* Breadcrumb - keep it with product details */}
                  <div className="border-b bg-muted/30">
                    <div className="container mx-auto px-4 py-3">
                      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link to={`/store/${store.subdomain}`} className="hover:text-primary transition-colors flex items-center gap-1">
                          <Home className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Home</span>
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <Link to={`/store/${store.subdomain}#products`} className="hover:text-primary transition-colors">
                          Products
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
                      </nav>
                    </div>
                  </div>
                  <main className="container mx-auto px-4 py-8 lg:py-12">
                    {renderProductDetails()}

                    {/* Tabs - included in product details section for now */}
                    <div className="mt-16">
                      <Tabs defaultValue="description" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                          <TabsTrigger
                            value="description"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                          >
                            Description
                          </TabsTrigger>
                          <TabsTrigger
                            value="reviews"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                          >
                            Reviews (128)
                          </TabsTrigger>
                          <TabsTrigger
                            value="size-chart"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                          >
                            Size Chart
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="description" className="pt-8">
                          <div className="max-w-3xl space-y-4 text-muted-foreground leading-relaxed">
                            <p>{product.description}</p>
                            <p>
                              Made with premium materials and designed for everyday comfort. This {product.name} features
                              durable stitching, a soft feel, and a modern fit that looks great on everyone.
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-4">
                              <li>Premium quality fabric</li>
                              <li>Durable and long-lasting print</li>
                              <li>Comfortable fit for all-day wear</li>
                              <li>Machine washable</li>
                            </ul>
                          </div>
                        </TabsContent>
                        <TabsContent value="reviews" className="pt-8">
                          {/* Reviews Tab Content - kept for backward compatibility if user wants inside tabs */}
                          <div className="space-y-8">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xl font-bold">Customer Reviews</h3>
                              <Button>Write a Review</Button>
                            </div>
                            <div className="grid gap-6">
                              {mockReviews.map((review) => (
                                <Card key={review.id} className="p-6">
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                        {review.avatar}
                                      </div>
                                      <div>
                                        <p className="font-semibold">{review.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <span>{review.date}</span>
                                          {review.verified && (
                                            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                              <Check className="w-3 h-3" /> Verified Purchase
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={cn(
                                            "w-4 h-4",
                                            star <= review.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                                          )}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-muted-foreground">{review.content}</p>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="size-chart" className="pt-8">
                          <div className="max-w-2xl border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-4 py-3 text-left font-semibold">Size</th>
                                  <th className="px-4 py-3 text-left font-semibold">Chest</th>
                                  <th className="px-4 py-3 text-left font-semibold">Length</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {defaultSizeChart.map((row) => (
                                  <tr key={row.size}>
                                    <td className="px-4 py-3 font-medium">{row.size}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{row.chest}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{row.length}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </main>
                </div>
              );
            }
            if (section.type === 'product-recommendations') {
              return (
                <div key={section.id} className="container mx-auto px-4 pb-16">
                  {renderRecommendations(section.settings?.heading, section.settings?.subheading)}
                </div>
              );
            }
            if (section.type === 'reviews') {
              return (
                <div key={section.id} className="bg-muted/10">
                  <div className="container mx-auto px-4">
                    <ReviewsSection
                      productId={productId || ''}
                      heading={section.settings?.heading || "Customer Reviews"}
                    />
                  </div>
                </div>
              );
            }
            if (section.type === 'footer') {
              return (
                <div key={section.id}>
                  {renderFooter(section)}
                </div>
              );
            }

            // Default handler for other sections (text, image, video, etc)
            return (
              <SectionRenderer
                key={section.id}
                section={section}
                products={products}
                globalStyles={store.builder?.globalStyles}
                isPreview={false}
              />
            );
          })}
        </div>
      ) : (
        // Default Hardcoded Layout
        <>
          {renderHeader()}

          {/* Breadcrumb */}
          <div className="border-b bg-muted/30">
            <div className="container mx-auto px-4 py-3">
              <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link to={`/store/${store.subdomain}`} className="hover:text-primary transition-colors flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link to={`/store/${store.subdomain}#products`} className="hover:text-primary transition-colors">
                  Products
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
              </nav>
            </div>
          </div>

          <main className="container mx-auto px-4 py-8 lg:py-12">
            {renderProductDetails()}

            {/* Tabs */}
            <div className="mt-16">
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                  <TabsTrigger
                    value="description"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                  >
                    Description
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                  >
                    Reviews (128)
                  </TabsTrigger>
                  <TabsTrigger
                    value="size-chart"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                  >
                    Size Chart
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="pt-8">
                  <div className="max-w-3xl space-y-4 text-muted-foreground leading-relaxed">
                    <p>{product.description}</p>
                    <p>
                      Made with premium materials and designed for everyday comfort. This {product.name} features
                      durable stitching, a soft feel, and a modern fit that looks great on everyone.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-4">
                      <li>Premium quality fabric</li>
                      <li>Durable and long-lasting print</li>
                      <li>Comfortable fit for all-day wear</li>
                      <li>Machine washable</li>
                    </ul>
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className="pt-8">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">Customer Reviews</h3>
                      <Button>Write a Review</Button>
                    </div>
                    <div className="grid gap-6">
                      {mockReviews.map((review) => (
                        <Card key={review.id} className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                {review.avatar}
                              </div>
                              <div>
                                <p className="font-semibold">{review.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{review.date}</span>
                                  {review.verified && (
                                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                      <Check className="w-3 h-3" /> Verified Purchase
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "w-4 h-4",
                                    star <= review.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground">{review.content}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="size-chart" className="pt-8">
                  <div className="max-w-2xl border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Size</th>
                          <th className="px-4 py-3 text-left font-semibold">Chest</th>
                          <th className="px-4 py-3 text-left font-semibold">Length</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {defaultSizeChart.map((row) => (
                          <tr key={row.size}>
                            <td className="px-4 py-3 font-medium">{row.size}</td>
                            <td className="px-4 py-3 text-muted-foreground">{row.chest}</td>
                            <td className="px-4 py-3 text-muted-foreground">{row.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {renderRecommendations()}
          </main>

          {renderFooter()}
        </>
      )}

      {/* Sticky Add to Cart Bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t py-3 px-4 z-50 transition-transform duration-300",
          showStickyBar ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {galleryImages[0] && (
              <img
                src={galleryImages[0]}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover border hidden sm:block"
              />
            )}
            <div className="min-w-0">
              <p className="font-semibold truncate">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                {selectedColor} / {selectedSize}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold hidden sm:block" style={{ color: theme.colors.primary }}>
              ${effectivePrice.toFixed(2)}
            </span>
            <Button size="lg" onClick={handleAddToCart} className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Add to Cart</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </div>

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
