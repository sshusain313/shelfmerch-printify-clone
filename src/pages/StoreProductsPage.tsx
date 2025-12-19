import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  List,
  ChevronDown,
  ChevronRight,
  X,
  Package,
  Filter,
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

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest' | 'oldest';
type ViewMode = 'grid' | 'list';

const StoreProductsPage: React.FC = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Store all products for filtering
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(true); // Show sidebar by default on desktop

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
        // Only include categories that exist in our config
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

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
        // Also remove all subcategories from this category
        const subcats = getSubcategories(categoryId as CategoryId);
        setSelectedSubcategories((prevSubs) => {
          const nextSubs = new Set(prevSubs);
          subcats.forEach((sub) => nextSubs.delete(sub));
          return nextSubs;
        });
      } else {
        next.add(categoryId);
        // Expand category when selected
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
        // Ensure parent category is selected
        setSelectedCategories((prev) => new Set(prev).add(categoryId));
        // Expand category when subcategory is selected
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

    // Category filter - if categories are selected, filter by them
    if (selectedCategories.size > 0) {
      filtered = filtered.filter((product) => {
        const productCategoryId = product.catalogProduct?.categoryId?.toString();
        return productCategoryId && selectedCategories.has(productCategoryId);
      });
    }

    // Subcategory filter - if subcategories are selected, filter by them
    if (selectedSubcategories.size > 0) {
      filtered = filtered.filter((product) => {
        // Check if product's subcategory matches any selected subcategory
        if (product.subcategoryIds && product.subcategoryIds.length > 0) {
          return product.subcategoryIds.some((subcat) => selectedSubcategories.has(subcat));
        }
        return product.subcategoryId && selectedSubcategories.has(product.subcategoryId);
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
  }, [allProducts, searchQuery, selectedCategories, selectedSubcategories, sortOption]);

  const handleProductClick = (product: Product) => {
    if (!store) return;
    navigate(`/store/${store.subdomain}/product/${product.id}`);
  };

  const handleAddToCart = (product: Product) => {
    // Navigate to product page for variant selection
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
      navigate(`/store/${store.subdomain}/auth?redirect=checkout`, { state: { cart } });
      return;
    }

    setCartOpen(false);
    navigate(`/store/${store.subdomain}/checkout`, {
      state: { cart, storeId: store.id, subdomain: store.subdomain },
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories(new Set());
    setSelectedSubcategories(new Set());
    setSortOption('newest');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedCategories.size > 0 || selectedSubcategories.size > 0;

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground mb-6">The store "{subdomain}" does not exist.</p>
          <Link to="/">
            <Button>Go to ShelfMerch</Button>
          </Link>
        </div>
      </div>
    );
  }

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

      {/* Main Content with Sidebar */}
      <div className="flex gap-8 container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Left Sidebar - Filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24">
            <div className="border rounded-lg bg-card p-6 space-y-6">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h2>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
                    Clear All
                  </Button>
                )}
              </div>

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 pb-4 border-b">
                  {selectedCategories.size > 0 && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      {selectedCategories.size} {selectedCategories.size === 1 ? 'Category' : 'Categories'}
                    </Badge>
                  )}
                  {selectedSubcategories.size > 0 && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      {selectedSubcategories.size} {selectedSubcategories.size === 1 ? 'Subcategory' : 'Subcategories'}
                    </Badge>
                  )}
                </div>
              )}

              {/* Categories and Subcategories */}
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-4">
                  {Object.values(CATEGORIES)
                    .filter((category) => availableCategories.includes(category.id))
                    .map((category) => {
                      const isExpanded = expandedCategories.has(category.id);
                      const isCategorySelected = selectedCategories.has(category.id);
                      const categorySubcategories = getSubcategories(category.id as CategoryId);
                      const availableSubs = availableSubcategoriesByCategory[category.id] || [];
                      const hasAvailableSubs = availableSubs.length > 0;

                      return (
                        <div key={category.id} className="space-y-2">
                          {/* Category Header */}
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`cat-${category.id}`}
                              checked={isCategorySelected}
                              onCheckedChange={() => toggleCategory(category.id)}
                            />
                            <label
                              htmlFor={`cat-${category.id}`}
                              className="flex-1 font-medium text-sm cursor-pointer flex items-center justify-between"
                              onClick={() => toggleCategory(category.id)}
                            >
                              <span>{category.name}</span>
                              {hasAvailableSubs && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCategoryExpansion(category.id);
                                  }}
                                  className="p-1 hover:bg-muted rounded"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </label>
                          </div>

                          {/* Subcategories */}
                          {hasAvailableSubs && isExpanded && (
                            <div className="ml-6 space-y-2 pl-4 border-l">
                              {categorySubcategories
                                .filter((sub) => availableSubs.includes(sub))
                                .map((subcategory) => {
                                  const isSubSelected = selectedSubcategories.has(subcategory);
                                  return (
                                    <div key={subcategory} className="flex items-center gap-2">
                                      <Checkbox
                                        id={`sub-${category.id}-${subcategory}`}
                                        checked={isSubSelected}
                                        onCheckedChange={() => toggleSubcategory(subcategory, category.id)}
                                      />
                                      <label
                                        htmlFor={`sub-${category.id}-${subcategory}`}
                                        className="text-sm text-muted-foreground cursor-pointer flex-1"
                                        onClick={() => toggleSubcategory(subcategory, category.id)}
                                      >
                                        {subcategory}
                                      </label>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link to={`/store/${store.subdomain}`} className="hover:text-primary transition-colors">
                Home
              </Link>
              <span>/</span>
              <span className="text-foreground">Products</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-2" style={{ fontFamily: theme.fonts.heading }}>
                  All Products
                </h1>
                <p className="text-muted-foreground text-lg">
                  Browse our complete collection of {allProducts.length} products
                </p>
              </div>
              {/* Mobile Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {selectedCategories.size + selectedSubcategories.size}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="product-search"
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-12 text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Sort and View Mode */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {Array.from(selectedCategories).map((catId) => {
                  const category = CATEGORIES[catId as CategoryId];
                  if (!category) return null;
                  return (
                    <Badge key={catId} variant="secondary" className="gap-1">
                      {category.name}
                      <button
                        onClick={() => {
                          setSelectedCategories((prev) => {
                            const next = new Set(prev);
                            next.delete(catId);
                            return next;
                          });
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
                {Array.from(selectedSubcategories).map((subcat) => (
                  <Badge key={subcat} variant="secondary" className="gap-1">
                    {subcat}
                    <button
                      onClick={() => {
                        setSelectedSubcategories((prev) => {
                          const next = new Set(prev);
                          next.delete(subcat);
                          return next;
                        });
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Filter Panel */}
          {showFilters && (
            <div className="lg:hidden mb-6 border rounded-lg p-6 bg-card space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filters</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-4">
                  {Object.values(CATEGORIES)
                    .filter((category) => availableCategories.includes(category.id))
                    .map((category) => {
                      const isExpanded = expandedCategories.has(category.id);
                      const isCategorySelected = selectedCategories.has(category.id);
                      const categorySubcategories = getSubcategories(category.id as CategoryId);
                      const availableSubs = availableSubcategoriesByCategory[category.id] || [];
                      const hasAvailableSubs = availableSubs.length > 0;

                      return (
                        <div key={category.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`mobile-cat-${category.id}`}
                              checked={isCategorySelected}
                              onCheckedChange={() => toggleCategory(category.id)}
                            />
                            <label
                              htmlFor={`mobile-cat-${category.id}`}
                              className="flex-1 font-medium text-sm cursor-pointer flex items-center justify-between"
                              onClick={() => toggleCategory(category.id)}
                            >
                              <span>{category.name}</span>
                              {hasAvailableSubs && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCategoryExpansion(category.id);
                                  }}
                                  className="p-1 hover:bg-muted rounded"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </label>
                          </div>
                          {hasAvailableSubs && isExpanded && (
                            <div className="ml-6 space-y-2 pl-4 border-l">
                              {categorySubcategories
                                .filter((sub) => availableSubs.includes(sub))
                                .map((subcategory) => {
                                  const isSubSelected = selectedSubcategories.has(subcategory);
                                  return (
                                    <div key={subcategory} className="flex items-center gap-2">
                                      <Checkbox
                                        id={`mobile-sub-${category.id}-${subcategory}`}
                                        checked={isSubSelected}
                                        onCheckedChange={() => toggleSubcategory(subcategory, category.id)}
                                      />
                                      <label
                                        htmlFor={`mobile-sub-${category.id}-${subcategory}`}
                                        className="text-sm text-muted-foreground cursor-pointer flex-1"
                                        onClick={() => toggleSubcategory(subcategory, category.id)}
                                      >
                                        {subcategory}
                                      </label>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </div>
          )}

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredAndSortedProducts.length}</span> of{' '}
            <span className="font-semibold text-foreground">{allProducts.length}</span> products
          </p>
        </div>

        {/* Products Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          </div>
        ) : filteredAndSortedProducts.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {filteredAndSortedProducts.map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(index * 0.05, 1)}s` }}
              >
                {viewMode === 'grid' ? (
                  <EnhancedProductCard
                    product={product}
                    onProductClick={handleProductClick}
                    onAddToCart={handleAddToCart}
                  />
                ) : (
                  <div className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      {product.mockupUrl ? (
                        <img
                          src={product.mockupUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
                        <Button size="sm" onClick={() => handleAddToCart(product)}>
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query'
                : 'No products are available at this time'}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            )}
          </div>
        )}
          </main>
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

