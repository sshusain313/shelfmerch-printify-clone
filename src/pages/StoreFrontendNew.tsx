import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Product, Store, CartItem } from '@/types';
import { storeApi, storeProductsApi } from '@/lib/api';
import { getTheme } from '@/lib/themes';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import CartDrawer from '@/components/storefront/CartDrawer';
import SectionRenderer from '@/components/builder/SectionRenderer';
import EnhancedStoreHeader from '@/components/storefront/EnhancedStoreHeader';
import EnhancedHeroSection from '@/components/storefront/EnhancedHeroSection';
import EnhancedProductsSection from '@/components/storefront/EnhancedProductsSection';
import AboutSection from '@/components/storefront/AboutSection';
import NewsletterSection from '@/components/storefront/NewsletterSection';
import EnhancedFooter from '@/components/storefront/EnhancedFooter';

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

            // Extract previewImagesByView from designData
            // previewImagesByView is an object with mockup IDs as keys and image URLs as values
            const previewImagesByView = sp.designData?.previewImagesByView || sp.previewImagesByView || {};
            const previewImageUrls = Object.values(previewImagesByView).filter((url): url is string => 
              typeof url === 'string' && url.length > 0
            );
            
            // Use first preview image as primary, fallback to galleryImages if no previews
            const primaryImage = previewImageUrls[0] || 
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
              // Use previewImagesByView URLs first, fallback to galleryImages if no previews
              mockupUrls: previewImageUrls.length > 0
                ? previewImageUrls
                : (Array.isArray(sp.galleryImages)
                    ? sp.galleryImages.map((img: any) => img.url).filter(Boolean)
                    : []),
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
      {/* Store Header - only show if builder doesn't have a header section */}
      {!hasBuilderHeader && (
        <EnhancedStoreHeader
          storeName={store.storeName}
          navLinks={[
            { name: 'Products', href: `/store/${store.subdomain}/products` },
            { name: 'About', href: '#about' },
            { name: 'Contact', href: '#contact' },
          ]}
          cartItemCount={cartItemCount}
          onCartClick={() => setCartOpen(true)}
          primaryColor={theme.colors.primary}
        />
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
        // Default theme-based layout with enhanced components
        <>
          {/* Hero Section */}
          <EnhancedHeroSection
            storeName={store.storeName}
            description={store.description}
          />

          {/* Featured Products Section - Show only first 6-8 products */}
          <EnhancedProductsSection
            products={products.slice(0, 8)}
            onProductClick={handleProductClick}
            onAddToCart={(product) => {
              // Navigate to product page for variant selection
              handleProductClick(product);
            }}
            showViewAllButton={products.length > 8}
            viewAllLink={`/store/${store.subdomain}/products`}
            title="Featured Products"
            subtitle="Featured Collection"
          />

          {/* About Section */}
          <AboutSection 
            storeName={store.storeName}
            description={store.description}
          />

          {/* Newsletter Section */}
          <NewsletterSection />
        </>
      )}

      {/* Footer - only show if builder doesn't have a footer section */}
      {!hasBuilderFooter && (
        <EnhancedFooter
          storeName={store.storeName}
          description={store.description}
        />
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
