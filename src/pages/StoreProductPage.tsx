import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Product, Store, CartItem } from '@/types';
import { storeApi, storeProductsApi } from '@/lib/api';
import { getTheme } from '@/lib/themes';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import SectionRenderer from '@/components/builder/SectionRenderer';
import CartDrawer from '@/components/storefront/CartDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Package,
  Shield,
  Truck,
  RefreshCw,
  Minus,
  Plus,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Check,
  Zap,
  Award,
  Clock,
  ChevronDown,
  Home,
  Copy,
} from 'lucide-react';
import { BuilderSection } from '@/types/builder';
import ImageMagnifier from '@/components/storefront/ImageMagnifier';
import { cn } from '@/lib/utils';

const mockReviews = [
  {
    id: 1,
    name: 'Alex Morgan',
    avatar: 'AM',
    rating: 5,
    date: 'October 12, 2025',
    verified: true,
    content:
      'The print quality is outstanding and the fabric feels premium. Would definitely recommend to anyone looking for comfort and style.',
  },
  {
    id: 2,
    name: 'Priya Desai',
    avatar: 'PD',
    rating: 4,
    date: 'October 05, 2025',
    verified: true,
    content:
      'Loved the colors and fit. Shipping was quick too! Slightly wish there were more pastel color options.',
  },
  {
    id: 3,
    name: 'Jordan Lee',
    avatar: 'JL',
    rating: 5,
    date: 'September 28, 2025',
    verified: false,
    content:
      'Fits perfectly and the size guide is accurate. The design looks even better in person. Great job!'
  },
];

const defaultSizeChart = [
  { size: 'S', chest: '34" - 36"', length: '28"', shoulder: '16"' },
  { size: 'M', chest: '38" - 40"', length: '29"', shoulder: '17"' },
  { size: 'L', chest: '42" - 44"', length: '30"', shoulder: '18"' },
  { size: 'XL', chest: '46" - 48"', length: '31"', shoulder: '19"' },
  { size: '2XL', chest: '50" - 52"', length: '32"', shoulder: '20"' },
];

const StoreProductPage: React.FC = () => {
  const { subdomain, productId } = useParams<{ subdomain: string; productId: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [variantPriceMap, setVariantPriceMap] = useState<Record<string, Record<string, number>>>({});
  const [colorHexMap, setColorHexMap] = useState<Record<string, string>>({});

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

          const variantDocs: any[] = Array.isArray(sp.variants) ? sp.variants : [];
          const colorSet = new Set<string>();
          const sizeSet = new Set<string>();
          const priceMap: Record<string, Record<string, number>> = {};
          const hexMap: Record<string, string> = {};

          variantDocs.forEach((v) => {
            const cv = v.catalogProductVariantId || {};
            const color = typeof cv.color === 'string' ? cv.color : undefined;
            const size = typeof cv.size === 'string' ? cv.size : undefined;
            if (!color || !size) return;

            if (cv.colorHex && typeof cv.colorHex === 'string') {
              hexMap[color] = cv.colorHex;
            }

            const variantPrice: number =
              typeof v.sellingPrice === 'number'
                ? v.sellingPrice
                : basePrice;

            colorSet.add(color);
            sizeSet.add(size);

            if (!priceMap[color]) priceMap[color] = {};
            priceMap[color][size] = variantPrice;
          });
          
          setColorHexMap(hexMap);

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

  const availableSizes = useMemo(() => {
    if (!product || !selectedColor) return [];
    const sizesForColor = variantPriceMap[selectedColor] ? Object.keys(variantPriceMap[selectedColor]) : [];
    return product.variants.sizes.filter(size => sizesForColor.includes(size));
  }, [product, selectedColor, variantPriceMap]);

  useEffect(() => {
    if (!selectedColor) return;
    const sizesForColor = variantPriceMap[selectedColor] ? Object.keys(variantPriceMap[selectedColor]) : [];
    if (selectedSize && !sizesForColor.includes(selectedSize)) {
      if (sizesForColor.length > 0) {
        setSelectedSize(sizesForColor[0]);
      } else {
        setSelectedSize('');
      }
    } else if (!selectedSize && sizesForColor.length > 0) {
      setSelectedSize(sizesForColor[0]);
    }
  }, [selectedColor, variantPriceMap]);

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

  const renderTrustBadgeIcon = (icon?: string) => {
    switch (icon) {
      case 'ShieldCheck':
      case 'Shield':
        return <Shield className="h-5 w-5" />;
      case 'Truck':
        return <Truck className="h-5 w-5" />;
      case 'RefreshCw':
      case 'RefreshCcw':
        return <RefreshCw className="h-5 w-5" />;
      case 'Package':
        return <Package className="h-5 w-5" />;
      default:
        return <Truck className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: theme.fonts.body }}>
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              to={`/store/${store.subdomain}`} 
              className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity" 
              style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading }}
            >
              {store.storeName}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/store/${store.subdomain}`)}
              className="hidden sm:flex"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
            <Button variant="ghost" size="icon" className="relative" onClick={() => setCartOpen(true)}>
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
        {/* Product Section */}
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
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "relative w-10 h-10 rounded-full border-2 transition-all hover:scale-110",
                          isSelected 
                            ? 'border-primary ring-2 ring-primary/30' 
                            : 'border-border hover:border-primary/50'
                        )}
                        style={{ backgroundColor: hex }}
                        title={color}
                        aria-label={`Select ${color} color`}
                      >
                        {isSelected && (
                          <Check 
                            className={cn(
                              "absolute inset-0 m-auto w-5 h-5",
                              hex.toLowerCase() === '#ffffff' || hex.toLowerCase() === '#fff' 
                                ? 'text-foreground' 
                                : 'text-white'
                            )} 
                          />
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
                  <button className="text-sm text-primary hover:underline flex items-center gap-1">
                    Size Guide
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.length > 0 ? (
                    availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "min-w-[52px] h-11 px-4 rounded-lg border-2 font-medium transition-all",
                          selectedSize === size 
                            ? 'border-primary bg-primary text-primary-foreground' 
                            : 'border-border hover:border-primary/50 bg-background'
                        )}
                      >
                        {size}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No sizes available for this color</p>
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <label className="text-sm font-semibold">Quantity</label>
                <div className="inline-flex items-center rounded-lg border bg-background">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="px-4 py-3 hover:bg-muted transition-colors rounded-l-lg"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-14 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="px-4 py-3 hover:bg-muted transition-colors rounded-r-lg"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="w-full h-14 text-base font-semibold gap-2"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart — ${(effectivePrice * quantity).toFixed(2)}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full h-14 text-base font-semibold"
                onClick={() => {
                  handleAddToCart();
                  handleCheckout();
                }}
              >
                Buy Now
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 text-center">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 text-center">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 text-center">
                <RefreshCw className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">Easy Returns</span>
              </div>
            </div>

            {/* Delivery Info */}
            <Card className="p-4 bg-accent/30 border-accent">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Order within 2 hrs 15 mins</p>
                  <p className="text-sm text-muted-foreground">Get it by <strong>Dec 26 - Dec 28</strong></p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mb-16">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-8">
              <TabsTrigger 
                value="description" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3"
              >
                Description
              </TabsTrigger>
              <TabsTrigger 
                value="size-chart"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3"
              >
                Size Chart
              </TabsTrigger>
              <TabsTrigger 
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3"
              >
                Reviews ({mockReviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="pt-6">
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  {product.description || 'High-quality product made with premium materials. Designed for comfort and style, this piece is perfect for everyday wear or special occasions.'}
                </p>
                <div className="grid sm:grid-cols-2 gap-6 mt-6">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      Premium Quality
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Made with high-quality materials that ensure durability and comfort.
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      Fast Fulfillment
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Ships within 2-3 business days with tracking provided.
                    </p>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="size-chart" className="pt-6">
              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Size</th>
                      <th className="px-4 py-3 text-left font-semibold">Chest</th>
                      <th className="px-4 py-3 text-left font-semibold">Length</th>
                      <th className="px-4 py-3 text-left font-semibold">Shoulder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultSizeChart.map((row, index) => (
                      <tr 
                        key={row.size} 
                        className={cn(
                          "border-t transition-colors",
                          row.size === selectedSize && "bg-primary/5"
                        )}
                      >
                        <td className="px-4 py-3 font-semibold">
                          {row.size}
                          {row.size === selectedSize && (
                            <Badge variant="secondary" className="ml-2 text-xs">Selected</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{row.chest}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.length}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.shoulder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="pt-6">
              <div className="space-y-6">
                {/* Rating Summary */}
                <Card className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold">4.8</div>
                      <div className="flex items-center justify-center gap-0.5 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={cn(
                              "w-5 h-5",
                              star <= 4 ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                            )} 
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Based on 128 reviews</p>
                    </div>
                    <Separator orientation="vertical" className="h-20 hidden sm:block" />
                    <div className="flex-1 space-y-2 w-full sm:w-auto">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center gap-3">
                          <span className="text-sm w-3">{rating}</span>
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div 
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${rating === 5 ? 65 : rating === 4 ? 25 : rating === 3 ? 8 : 2}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8">
                            {rating === 5 ? '65%' : rating === 4 ? '25%' : rating === 3 ? '8%' : '2%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Reviews List */}
                <div className="grid gap-4">
                  {mockReviews.map((review) => (
                    <Card key={review.id} className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {review.avatar}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{review.name}</span>
                              {review.verified && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <Check className="w-3 h-3" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
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
                          <p className="text-muted-foreground leading-relaxed">{review.content}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 
                  className="text-2xl font-bold" 
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  You May Also Like
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Explore more designs that pair perfectly with this product.
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
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {store.storeName}. Powered by{' '}
          <Link to="/" className="text-primary hover:underline font-medium">
            ShelfMerch
          </Link>
        </div>
      </footer>

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
