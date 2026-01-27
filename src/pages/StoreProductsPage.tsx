import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { getTenantSlugFromLocation, buildStorePath } from '@/utils/tenantUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product, Store, CartItem } from '@/types';
import { storeApi, storeProductsApi } from '@/lib/api';
import { getTheme } from '@/lib/themes';
import { toast } from 'sonner';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import CartDrawer from '@/components/storefront/CartDrawer';
import EnhancedStoreHeader from '@/components/storefront/EnhancedStoreHeader';
import EnhancedFooter from '@/components/storefront/EnhancedFooter';
import EnhancedProductCard from '@/components/storefront/EnhancedProductCard';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Grid3x3,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronRight,
  X,
  Package,
  Filter,
  Sparkles,
  TrendingUp,
  Clock,
  Tag,
  Home,
  ShoppingBag,
  Heart,
  Loader2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { CATEGORIES, getSubcategories, type CategoryId } from '@/config/productCategories';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FilterSidebar } from '@/pages/FilterSidebar';
import { CategorySidebar } from '@/components/CategorySidebar';

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest' | 'oldest';
type ViewMode = 'grid' | 'list';

const StoreProductsPage: React.FC = () => {
  const params = useParams<{ subdomain: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get tenant slug from subdomain (hostname) or path parameter (fallback)
  const subdomain = getTenantSlugFromLocation(location, params) || params.subdomain;
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // FilterSidebar state (matching CategoryProducts pattern)
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const { isAuthenticated, checkAuth } = useStoreAuth();

  // Load store data
  const loadStoreData = useCallback(async () => {
    if (!subdomain) return;

    try {
      const response = await storeApi.getBySubdomain(subdomain);
      if (response && response.success && response.data) {
        setStore(response.data as Store);
      } else {
        setStore(null);
      }
    } catch (err) {
      console.error('Failed to fetch store from backend:', err);
      setStore(null);
    }
  }, [subdomain]);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      if (!store) return;

      try {
        setLoading(true);
        const resp = await storeProductsApi.listPublic(store.id);
        if (resp.success) {
          const forStore = resp.data || [];

          const mapped: Product[] = forStore.map((sp: any) => {
            const id = sp._id?.toString?.() || sp.id;
            const basePrice: number =
              typeof sp.sellingPrice === 'number'
                ? sp.sellingPrice
                : typeof sp.price === 'number'
                  ? sp.price
                  : 0;

            const previewImagesByView = sp.designData?.previewImagesByView || sp.previewImagesByView || {};
            const previewImageUrls = Object.values(previewImagesByView).filter((url): url is string =>
              typeof url === 'string' && url.length > 0
            );

            const primaryImage =
              previewImageUrls[0] ||
              sp.galleryImages?.find((img: any) => img.isPrimary)?.url ||
              (Array.isArray(sp.galleryImages) && sp.galleryImages[0]?.url) ||
              undefined;

            const catalogProduct =
              sp.catalogProductId && typeof sp.catalogProductId === 'object'
                ? sp.catalogProductId
                : null;
            const catalogProductId =
              catalogProduct?._id?.toString() ||
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
              mockupUrls:
                previewImageUrls.length > 0
                  ? previewImageUrls
                  : Array.isArray(sp.galleryImages)
                    ? sp.galleryImages.map((img: any) => img.url).filter(Boolean)
                    : [],
              designs: sp.designData?.designs || {},
              designBoundaries: sp.designData?.designBoundaries,
              variants: {
                colors: sp.designData?.selectedColors || [],
                sizes: sp.designData?.selectedSizes || [],
              },
              categoryId: catalogProduct?.categoryId?.toString() || catalogProduct?.categoryId,
              subcategoryId:
                catalogProduct?.subcategoryIds?.[0]?.toString() ||
                (Array.isArray(catalogProduct?.subcategoryIds) && catalogProduct.subcategoryIds[0]) ||
                catalogProduct?.subcategoryIds?.[0],
              subcategoryIds: Array.isArray(catalogProduct?.subcategoryIds)
                ? catalogProduct.subcategoryIds.map((id: any) => id?.toString() || id)
                : [],
              catalogProduct: catalogProduct,
              createdAt: sp.createdAt || new Date().toISOString(),
              updatedAt: sp.updatedAt || new Date().toISOString(),
            };
          });

          setAllProducts(mapped);
          setProducts(mapped);
        }
      } catch (e) {
        console.error('Failed to load store products', e);
        setAllProducts([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [store]);

  useEffect(() => {
    if (!subdomain) return;
    loadStoreData();
  }, [subdomain, loadStoreData]);

  useEffect(() => {
    if (subdomain) {
      checkAuth(subdomain);
    }
  }, [subdomain, checkAuth]);

  // Get available categories and subcategories from products
  const { availableCategories, availableSubcategoriesByCategory } = useMemo(() => {
    const catSet = new Set<string>();
    const subcatMap: Record<string, Set<string>> = {};

    allProducts.forEach((product) => {
      if (product.catalogProduct?.categoryId) {
        const catId = product.catalogProduct.categoryId.toString();
        if (catId in CATEGORIES) {
          catSet.add(catId);

          if (!subcatMap[catId]) {
            subcatMap[catId] = new Set<string>();
          }

          if (product.subcategoryIds && product.subcategoryIds.length > 0) {
            product.subcategoryIds.forEach((subcatId) => {
              subcatMap[catId].add(subcatId);
            });
          } else if (product.subcategoryId) {
            subcatMap[catId].add(product.subcategoryId);
          }
        }
      }
    });

    return {
      availableCategories: Array.from(catSet),
      availableSubcategoriesByCategory: Object.fromEntries(
        Object.entries(subcatMap).map(([key, value]) => [key, Array.from(value)])
      ),
    };
  }, [allProducts]);

  // Extract available colors, sizes, and materials from products (for FilterSidebar)
  useEffect(() => {
    const colorsSet = new Set<string>();
    const sizesSet = new Set<string>();
    const materialsSet = new Set<string>();

    allProducts.forEach((product: any) => {
      // Extract colors: prioritize availableColors (backend deduplicated), fallback to variants
      if (product.availableColors && Array.isArray(product.availableColors)) {
        product.availableColors.forEach((color: string) => {
          if (color && typeof color === 'string') colorsSet.add(color.trim());
        });
      } else if (product.variants?.colors && Array.isArray(product.variants.colors)) {
        // Fallback: extract from variants only if availableColors is missing
        product.variants.colors.forEach((color: string) => {
          if (color && typeof color === 'string') colorsSet.add(color.trim());
        });
      }

      // Extract sizes from variants
      if (product.variants?.sizes && Array.isArray(product.variants.sizes)) {
        product.variants.sizes.forEach((size: string) => {
          if (size) sizesSet.add(size);
        });
      }

      // Extract materials from catalogProduct attributes
      const material = (product.catalogProduct as any)?.attributes?.material;
      if (material && typeof material === 'string') {
        materialsSet.add(material);
      }
    });

    setAvailableColors(Array.from(colorsSet).sort());
    setAvailableSizes(Array.from(sizesSet).sort());
    setAvailableMaterials(Array.from(materialsSet).sort());
  }, [allProducts]);

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
        const subcats = getSubcategories(categoryId as CategoryId);
        setSelectedSubcategories((prevSubs) => {
          const nextSubs = new Set(prevSubs);
          subcats.forEach((sub) => nextSubs.delete(sub));
          return nextSubs;
        });
      } else {
        next.add(categoryId);
        setExpandedCategories((prev) => new Set(prev).add(categoryId));
      }
      return next;
    });
  };

  // Toggle subcategory selection
  const toggleSubcategory = (subcategory: string, categoryId: string) => {
    setSelectedSubcategories((prev) => {
      const next = new Set(prev);
      if (next.has(subcategory)) {
        next.delete(subcategory);
      } else {
        next.add(subcategory);
        setSelectedCategories((prev) => new Set(prev).add(categoryId));
        setExpandedCategories((prev) => new Set(prev).add(categoryId));
      }
      return next;
    });
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...allProducts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    // Category filter
    if (selectedCategories.size > 0) {
      filtered = filtered.filter((product) => {
        const productCategoryId = product.catalogProduct?.categoryId?.toString();
        return productCategoryId && selectedCategories.has(productCategoryId);
      });
    }

    // Subcategory filter
    // Subcategory filter
    if (selectedSubcategories.size > 0) {
      filtered = filtered.filter((product) => {
        if (product.subcategoryIds && product.subcategoryIds.length > 0) {
          return product.subcategoryIds.some((subcat) => selectedSubcategories.has(subcat));
        }
        return product.subcategoryId && selectedSubcategories.has(product.subcategoryId);
      });
    }

    // Color filter
    if (selectedColors.length > 0) {
      filtered = filtered.filter((product) => {
        const productColors = product.variants?.colors || [];
        return productColors.some((color: string) => selectedColors.includes(color));
      });
    }

    // Size filter
    if (selectedSizes.length > 0) {
      filtered = filtered.filter((product) => {
        const productSizes = product.variants?.sizes || [];
        return productSizes.some((size: string) => selectedSizes.includes(size));
      });
    }

    // Material filter
    if (selectedMaterials.length > 0) {
      filtered = filtered.filter((product) => {
        const productMaterial = (product.catalogProduct as any)?.attributes?.material;
        return productMaterial && typeof productMaterial === 'string' && selectedMaterials.includes(productMaterial);
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [allProducts, searchQuery, selectedCategories, selectedSubcategories, selectedColors, selectedSizes, selectedMaterials, sortOption]);

  const handleProductClick = (product: Product) => {
    if (!store) return;
    const path = buildStorePath(`/product/${product.id}`, store.subdomain);
    navigate(path);
  };

  const handleAddToCart = (product: Product) => {
    handleProductClick(product);
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

  const handleCheckout = () => {
    if (!store) return;

    if (!isAuthenticated) {
      const authPath = buildStorePath('/auth?redirect=checkout', store.subdomain);
      navigate(authPath, { state: { cart } });
      return;
    }

    setCartOpen(false);
    const checkoutPath = buildStorePath('/checkout', store.subdomain);
    navigate(checkoutPath, {
      state: { cart, storeId: store.id, subdomain: store.subdomain },
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories(new Set());
    setSelectedSubcategories(new Set());
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedMaterials([]);
    setSortOption('newest');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedCategories.size > 0 || selectedSubcategories.size > 0 ||
    selectedColors.length > 0 || selectedSizes.length > 0 || selectedMaterials.length > 0;

  const activeFilterCount = selectedCategories.size + selectedSubcategories.size + selectedColors.length + selectedSizes.length + selectedMaterials.length;

  if (!store && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Store Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The store "{subdomain}" doesn't exist or may have been removed.
          </p>
          <Link to="/">
            <Button size="lg" className="gap-2">
              <Home className="h-4 w-4" />
              Go to ShelfMerch
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!store) return null;

  const theme = getTheme(store.theme);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Store Header */}
      <EnhancedStoreHeader
        storeName={store.storeName}
        navLinks={[
          { name: 'Home', href: `/store/${store.subdomain}` },
          { name: 'Products', href: `/store/${store.subdomain}/products` },
          { name: 'About', href: `#about` },
        ]}
        cartItemCount={cartItemCount}
        onCartClick={() => setCartOpen(true)}
        onSearchClick={() => {
          const searchInput = document.getElementById('product-search');
          if (searchInput) {
            (searchInput as HTMLInputElement).focus();
          }
        }}
        primaryColor={theme.colors.primary}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-muted/50 via-muted/30 to-background border-b border-border/50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link
              to={`/store/${store.subdomain}`}
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Products</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-2xl">
              <h1
                className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-4"
                style={{ fontFamily: theme.fonts.heading }}
              >
                <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                  Our Collection
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                Discover {allProducts.length} carefully curated products crafted with quality and passion
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex gap-8">
          {/* Desktop Sidebar - Category + Filters (stacked like CategoryProducts) */}
          <div className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 gap-6">
            <CategorySidebar />
            <FilterSidebar
              availableMaterials={availableMaterials}
              availableColors={availableColors}
              availableSizes={availableSizes}
              selectedMaterials={selectedMaterials}
              selectedColors={selectedColors}
              selectedSizes={selectedSizes}
              onFiltersChange={({ materials, colors, sizes }) => {
                setSelectedMaterials(materials);
                setSelectedColors(colors);
                setSelectedSizes(sizes);
              }}
            />
                  </div>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {/* Search & Controls Bar */}
            <div className="bg-card border border-border/50 rounded-2xl p-4 mb-6 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="product-search"
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-10 h-12 text-base border-border/50 rounded-xl bg-background focus-visible:ring-primary/30"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  {/* Mobile Filter Button */}
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden gap-2 h-12 px-4 rounded-xl">
                        <Filter className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                          <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[320px] sm:w-[380px]">
                      <SheetHeader className="mb-6">
                        <SheetTitle className="flex items-center gap-2">
                          <SlidersHorizontal className="h-5 w-5" />
                          Filters
                        </SheetTitle>
                      </SheetHeader>
                      <div className="space-y-6">
                        <CategorySidebar />
                        <FilterSidebar
                          availableMaterials={availableMaterials}
                          availableColors={availableColors}
                          availableSizes={availableSizes}
                          selectedMaterials={selectedMaterials}
                          selectedColors={selectedColors}
                          selectedSizes={selectedSizes}
                          onFiltersChange={({ materials, colors, sizes }) => {
                            setSelectedMaterials(materials);
                            setSelectedColors(colors);
                            setSelectedSizes(sizes);
                          }}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Sort Dropdown */}
                  <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                    <SelectTrigger className="w-[180px] h-12 rounded-xl border-border/50">
                      <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Newest First
                        </span>
                      </SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="price-asc">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Price (Low to High)
                        </span>
                      </SelectItem>
                      <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode Toggle */}
                  <div className="hidden sm:flex items-center border border-border/50 rounded-xl p-1 bg-muted/30">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredAndSortedProducts.length}</span> of{' '}
                <span className="font-semibold text-foreground">{allProducts.length}</span> products
              </p>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-primary hover:text-primary/80 hover:bg-primary/5"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>

            {/* Products Grid/List */}
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-muted animate-pulse" />
                    <Loader2 className="absolute inset-0 m-auto h-8 w-8 text-primary animate-spin" />
                  </div>
                  <p className="mt-6 text-muted-foreground font-medium">Loading products...</p>
                </div>
              </div>
            ) : filteredAndSortedProducts.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {filteredAndSortedProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-fade-up opacity-0"
                    style={{
                      animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    {viewMode === 'grid' ? (
                      <EnhancedProductCard
                        product={product}
                        onProductClick={handleProductClick}
                        onAddToCart={handleAddToCart}
                      />
                    ) : (
                      // List View Card
                      <div
                        className="group flex gap-5 p-5 bg-card border border-border/50 rounded-2xl hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer"
                        onClick={() => handleProductClick(product)}
                      >
                        {/* Product Image */}
                        <div className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-muted/50">
                          {product.mockupUrl ? (
                            <img
                              src={product.mockupUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                          )}
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                                Sale
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div>
                            <h3 className="font-semibold text-lg mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                              {product.description || 'Premium quality product'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-primary">
                                ₹{product.price.toFixed(2)}
                              </span>
                              {product.compareAtPrice && product.compareAtPrice > product.price && (
                                <span className="text-sm text-muted-foreground line-through">
                                  ₹{product.compareAtPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full hover:bg-red-50 hover:text-red-500"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.success('Added to wishlist');
                                }}
                              >
                                <Heart className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-full px-5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Empty State
              <div className="text-center py-24">
                <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">No products found</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {hasActiveFilters
                    ? "We couldn't find any products matching your filters. Try adjusting your search criteria."
                    : 'No products are available at this time. Check back soon!'}
                </p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="outline" size="lg" className="gap-2">
                    <X className="h-4 w-4" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <EnhancedFooter
        storeName={store.storeName}
        description={store.description || 'Premium custom merchandise designed with passion'}
      />

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

export default StoreProductsPage;
