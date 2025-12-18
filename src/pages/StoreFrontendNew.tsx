import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import { ShoppingCart, Search, Menu, X, Package } from 'lucide-react';
import { Product, Store, CartItem } from '@/types';
import { storeApi, storeProductsApi } from '@/lib/api';
import { getTheme } from '@/lib/themes';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import CartDrawer from '@/components/storefront/CartDrawer';
import SectionRenderer from '@/components/builder/SectionRenderer';

const StoreFrontendNew = () => {
  const { user, isMerchant, isAdmin } = useAuth();
  const { subdomain } = useParams<{ subdomain: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [spLoading, setSpLoading] = useState(false);
  const [spFilter, setSpFilter] = useState<{ status?: 'draft' | 'published'; isActive?: boolean }>({
    status: 'published',
    isActive: true,
  });

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
        const resp = await storeProductsApi.listPublic(store.id);
        if (resp.success) {
          const forStore = resp.data || [];
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

            // Extract catalog product data (populated from backend)
            const catalogProduct = sp.catalogProductId && typeof sp.catalogProductId === 'object' 
              ? sp.catalogProductId 
              : null;
            const catalogProductId = catalogProduct?._id?.toString() || 
                                   (typeof sp.catalogProductId === 'string' ? sp.catalogProductId : '');

            return {
              id,
              userId: store.userId,
              name: sp.title || sp.name || catalogProduct?.name || 'Untitled product',
              description: sp.description || catalogProduct?.description,
              baseProduct: catalogProductId,
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
              // Include category/subcategory from catalog product for collection filtering
              categoryId: catalogProduct?.categoryId?.toString() || catalogProduct?.categoryId,
              subcategoryId: catalogProduct?.subcategoryIds?.[0]?.toString() || 
                            (Array.isArray(catalogProduct?.subcategoryIds) && catalogProduct.subcategoryIds[0]) ||
                            catalogProduct?.subcategoryIds?.[0],
              subcategoryIds: Array.isArray(catalogProduct?.subcategoryIds)
                ? catalogProduct.subcategoryIds.map((id: any) => id?.toString() || id)
                : [],
              // Store reference to catalog product for collection filtering
              catalogProduct: catalogProduct,
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

  // Function to load store data
  const loadStoreData = useCallback(async () => {
    if (!subdomain) return;

    try {
      const response = await storeApi.getBySubdomain(subdomain);
      if (response && response.success && response.data) {
        const foundStore = response.data as Store;
        setStore(foundStore);
      } else {
        setStore(null);
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to fetch store from backend:', err);
      setStore(null);
      setProducts([]);
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

  // Listen for store updates (when store is published)
  useEffect(() => {
    const handleStoreUpdate = (event: CustomEvent) => {
      if (event.detail.type === 'store' && event.detail.data) {
        const updatedStore = event.detail.data;
        // Only reload if this update is for the current store
        if (updatedStore.subdomain === subdomain) {
          setStore(updatedStore);
        }
      }
    };

    window.addEventListener('shelfmerch-data-update', handleStoreUpdate as EventListener);
    return () => {
      window.removeEventListener('shelfmerch-data-update', handleStoreUpdate as EventListener);
    };
  }, [subdomain]);

  // Cart is kept only in memory for this session; no local/session storage

  const handleAddToCart = (product: Product, variant: { color: string; size: string }, quantity: number) => {
    const existingIndex = cart.findIndex(
      (item) =>
        item.productId === product.id &&
        item.variant.color === variant.color &&
        item.variant.size === variant.size
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
      setCart(newCart);
      toast.success('Updated cart quantity');
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          product,
          quantity,
          variant,
        },
      ]);
      toast.success('Added to cart');
    }
  };

  const handleUpdateQuantity = (productId: string, variant: any, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId, variant);
      return;
    }

    setCart(
      cart.map((item) =>
        item.productId === productId &&
          item.variant.color === variant.color &&
          item.variant.size === variant.size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string, variant: any) => {
    setCart(
      cart.filter(
        (item) =>
          !(
            item.productId === productId &&
            item.variant.color === variant.color &&
            item.variant.size === variant.size
          )
      )
    );
  };

  const handleProductClick = (product: Product) => {
    if (!store) return;
    navigate(`/store/${store.subdomain}/product/${product.id}`);
  };

  const { isAuthenticated, checkAuth } = useStoreAuth();

  // Check auth on mount
  useEffect(() => {
    if (subdomain) {
      checkAuth(subdomain);
    }
  }, [subdomain]);

  const handleCheckout = () => {
    if (!store) return;

    if (!isAuthenticated) {
      navigate(`/store/${store.subdomain}/auth?redirect=checkout`, { state: { cart } });
      return;
    }

    setCartOpen(false);
    navigate(`/store/${store.subdomain}/checkout`, {
      state: { cart, storeId: store.id, subdomain: store.subdomain },
    });
  };

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The store "{subdomain}" does not exist.
          </p>
          <Link to="/">
            <Button>Go to ShelfMerch</Button>
          </Link>
        </div>
      </div>
    );
  }

  const theme = getTheme(store.theme);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Check if store is using builder
  const usingBuilder = store.useBuilder && store.builder;
  const activePage = usingBuilder ? store.builder!.pages.find(p => p.slug === '/') : null;

  // Check if builder has header/footer sections
  const hasBuilderHeader = activePage?.sections.some(s => s.type === 'header' && s.visible);
  const hasBuilderFooter = activePage?.sections.some(s => s.type === 'footer' && s.visible);

  // Get builder global styles for theming
  const builderStyles = usingBuilder ? store.builder!.globalStyles : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Simulated Custom Domain Bar */}
      <div className="bg-primary/10 border-b border-primary/20 py-2 px-4 text-center text-sm">
        <span className="font-mono font-semibold">{store.subdomain}.shelfmerch.com</span>
        <span className="text-muted-foreground ml-2">• Powered by ShelfMerch</span>
      </div>

      {/* Store Header - only show if builder doesn't have a header section */}
      {!hasBuilderHeader && (
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 
                  className="text-2xl font-bold" 
                  style={{ color: builderStyles?.primaryColor || theme.colors.primary }}
                >
                  {store.storeName}
                </h1>
                <nav className="hidden md:flex space-x-6">
                  <a
                    href="#products"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Products
                  </a>
                  <a href="#about" className="text-sm hover:text-primary transition-colors">
                    About
                  </a>
                  <a
                    href="#contact"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Contact
                  </a>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setCartOpen(true)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Render Builder Layout or Default Layout */}
      {usingBuilder && activePage ? (
        // Builder-based layout
        <div>
          {activePage.sections
            .filter((s) => s.visible)
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <SectionRenderer
                key={section.id}
                section={section}
                products={products}
                globalStyles={store.builder!.globalStyles}
                isPreview={false}
                onProductClick={handleProductClick}
              />
            ))}
        </div>
      ) : (
        // Default theme-based layout
        <>
          {/* Hero Section */}
          <section
            className="py-20"
            style={{
              background: `linear-gradient(to bottom right, ${theme.colors.primary}15, ${theme.colors.background})`,
            }}
          >
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-5xl font-bold mb-4" style={{ fontFamily: theme.fonts.heading }}>
                Welcome to {store.storeName}
              </h2>
              <p
                className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
                style={{ fontFamily: theme.fonts.body }}
              >
                {store.description || 'Discover our collection of custom designed merchandise'}
              </p>
              <Button
                size="lg"
                style={{ backgroundColor: theme.colors.primary }}
                asChild
              >
                <a href="#products">Shop Now</a>
              </Button>
            </div>
          </section>

          {/* Products Section */}
          <section id="products" className="py-16">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Our Products</h2>
                  <p className="text-muted-foreground">
                    {products.length} {products.length === 1 ? 'product' : 'products'} available
                  </p>
                </div>
              </div>

              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => {
                    const mockup = product.mockupUrls?.[0] || product.mockupUrl;
                    const sellingPrice = product.price;
                    const compareAtPrice = product.compareAtPrice;

                    return (
                      <Card
                        key={product.id}
                        className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => handleProductClick(product)}
                      >
                        <div className="aspect-square bg-muted relative overflow-hidden">
                          {mockup ? (
                            <img
                              src={mockup}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Package className="h-16 w-16" />
                            </div>
                          )}
                          {typeof compareAtPrice === 'number' && compareAtPrice > sellingPrice && (
                            <Badge className="absolute top-2 right-2 bg-red-500">
                              Save ${(compareAtPrice - sellingPrice).toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-2">
                              <p
                                className="text-lg font-bold"
                                style={{ color: theme.colors.primary }}
                              >
                                ${sellingPrice.toFixed(2)}
                              </p>
                              {typeof compareAtPrice === 'number' && compareAtPrice > sellingPrice && (
                                <p className="text-sm text-muted-foreground line-through">
                                  ${compareAtPrice.toFixed(2)}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              style={{ backgroundColor: theme.colors.primary }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductClick(product);
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Products Yet</h3>
                  <p className="text-muted-foreground">
                    The store owner is currently adding products. Check back soon!
                  </p>
                </Card>
              )}
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="py-16 bg-muted/30">
            <div className="container mx-auto px-4 max-w-3xl text-center">
              <h2 className="text-3xl font-bold mb-4">About Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                {store.storeName} brings you high-quality custom merchandise designed with passion.
                Every product is printed on demand, ensuring freshness and reducing waste. We're
                committed to delivering exceptional quality and customer satisfaction.
              </p>
            </div>
          </section>
        </>
      )}

      {/* Footer - only show if builder doesn't have a footer section */}
      {!hasBuilderFooter && (
        <footer className="border-t py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 {store.storeName}. Powered by{' '}
              <Link to="/" className="text-primary hover:underline">
                ShelfMerch
              </Link>
            </p>
          </div>
        </footer>
      )}

      {/* Cart Drawer */}
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

export default StoreFrontendNew;
