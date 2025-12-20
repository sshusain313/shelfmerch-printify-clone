import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Package,
  Plus,
  DollarSign,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Product } from '@/types';
import { storeProductsApi } from '@/lib/api';
import { storeOrdersApi } from '@/lib/api';
import { getProducts } from '@/lib/localStorage';
import { Checkbox } from '@/components/ui/checkbox';
import { Order } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';

const Dashboard = () => {
  const { selectedStore, stores } = useStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [storageUsage, setStorageUsage] = useState<{ used: number; limit: number } | null>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [spLoading, setSpLoading] = useState(false);
  const [spFilter, setSpFilter] = useState<{ status?: 'draft' | 'published'; isActive?: boolean }>({});

  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [productToPublish, setProductToPublish] = useState<any>(null);
  const [targetStoreIds, setTargetStoreIds] = useState<string[]>([]);

  const storageKey = useMemo(() => `products_storage`, []);

  useEffect(() => {
    const loadProducts = () => {
      const loadedProducts = getProducts('default');
      setProducts(loadedProducts);
      if (storageKey) {
        const raw = localStorage.getItem(storageKey) || '';
        const usedBytes = raw ? new Blob([raw]).size : 0;
        const limitBytes = 5 * 1024 * 1024; // ~5MB typical browser localStorage quota per origin
        setStorageUsage({ used: usedBytes, limit: limitBytes });
      }
    };

    loadProducts();

    // Listen for real-time updates
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (!customEvent.detail?.type || customEvent.detail.type === 'product') {
        loadProducts();
      }
    };

    const handleStorage = () => {
      loadProducts();
    };

    window.addEventListener('shelfmerch-data-update', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('shelfmerch-data-update', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [storageKey]);

  // Load Store Products from backend - filtered by selected store
  useEffect(() => {
    const loadSP = async () => {
      try {
        setSpLoading(true);
        const resp = await storeProductsApi.list(spFilter);
        if (resp.success) {
          let products = resp.data || [];
          // Filter by selected store if one is selected
          if (selectedStore) {
            const storeId = selectedStore.id || selectedStore._id;
            products = products.filter((sp: any) => {
              const spStoreId = sp.storeId?._id?.toString() || sp.storeId?.toString() || sp.storeId;
              return spStoreId === storeId || spStoreId === selectedStore._id || spStoreId === selectedStore.id;
            });
          }
          setStoreProducts(products);
        }
      } catch (e) {
        console.error('Failed to load store products', e);
      } finally {
        setSpLoading(false);
      }
    };
    loadSP();
  }, [spFilter, selectedStore]);

  // Load Orders from backend - filtered by selected store
  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        setSpLoading(true);
        const data = await storeOrdersApi.listForMerchant();
        if (isMounted) {
          // Filter orders by selected store if one is selected
          let filteredOrders = data || [];
          if (selectedStore) {
            const storeId = selectedStore.id || selectedStore._id;
            filteredOrders = data.filter((order: Order) => {
              const orderStoreId = order.storeId?.toString();
              return orderStoreId === storeId || orderStoreId === selectedStore._id || orderStoreId === selectedStore.id;
            });
          }
          setOrders(filteredOrders);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load orders');
        }
      } finally {
        if (isMounted) {
          setSpLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [selectedStore]);

  // Note: StoreContext automatically refreshes stores when user changes, no need to call refreshStores here

  const updateStoreProduct = async (id: string, updates: any) => {
    try {
      const resp = await storeProductsApi.update(id, updates);
      if (resp.success) {
        setStoreProducts(prev => prev.map(p => (p._id === id ? resp.data : p)));
      }
    } catch (e) {
      console.error('Update failed', e);
    }
  };

  const handlePublishClick = (sp: any) => {
    // If multiple stores, allow choice
    if (stores.length > 1) {
      setProductToPublish(sp);
      // Default to selected store if available, or the product's store, or first store
      const currentStoreId = selectedStore?.id || selectedStore?._id ||
        sp.storeId?._id?.toString() || sp.storeId?.toString() ||
        stores[0]?.id || stores[0]?._id;
      setTargetStoreIds(currentStoreId ? [currentStoreId] : []);
      setPublishDialogOpen(true);
    } else if (stores.length === 1) {
      // Just one store, proceed as before
      updateStoreProduct(sp._id, { status: 'published' });
    } else {
      // No stores available
      toast.error('Please create a store first');
    }
  };

  const confirmPublish = async () => {
    if (!productToPublish || targetStoreIds.length === 0) return;

    try {
      const promises = targetStoreIds.map(async (storeId) => {
        // If same store, just update status
        if (productToPublish.storeId === storeId) {
          return updateStoreProduct(productToPublish._id, { status: 'published' });
        } else {
          // Different store: create copy and publish
          const payload = {
            storeId: storeId,
            catalogProductId: productToPublish.catalogProductId,
            sellingPrice: productToPublish.sellingPrice,
            compareAtPrice: productToPublish.compareAtPrice,
            title: productToPublish.title,
            description: productToPublish.description,
            tags: productToPublish.tags,
            status: 'published' as const,
            galleryImages: productToPublish.galleryImages,
            designData: productToPublish.designData,
            // Map variants if they exist
            variants: productToPublish.variants?.map((v: any) => ({
              catalogProductVariantId: v.catalogProductVariantId || v.id,
              sku: v.sku,
              sellingPrice: v.sellingPrice,
              isActive: v.isActive !== false
            }))
          };

          const resp = await storeProductsApi.create(payload);
          if (resp.success) {
            setStoreProducts(prev => [resp.data, ...prev]);
          }
          return resp;
        }
      });

      await Promise.all(promises);

    } catch (err) {
      console.error("Publish failed", err);
    } finally {
      setPublishDialogOpen(false);
      setProductToPublish(null);
      setTargetStoreIds([]);
    }
  };

  const deleteStoreProduct = async (id: string) => {
    try {
      const resp = await storeProductsApi.delete(id);
      if (resp.success) {
        setStoreProducts(prev => prev.filter(p => p._id !== id));
      }
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.id) {
      navigate(`/dashboard/products/${product.id}`);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts((prev) => {
      if (checked) {
        return prev.includes(productId) ? prev : [...prev, productId];
      }
      return prev.filter((id) => id !== productId);
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map((product) => product.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  };

  const stats = [
    { label: 'Total Orders', value: `${orders.length}`, icon: ShoppingBag, color: 'text-primary' },
    { label: 'Products', value: `${storeProducts.length}`, icon: Package, color: 'text-blue-500' },
    {
      label: 'Revenue',
      value: `$${orders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-500',
    },
    { label: 'Profit', value: '$0', icon: TrendingUp, color: 'text-purple-500' },
  ];

  return (
    <DashboardLayout >
    <div className="min-h-screen bg-background">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold">Welcome back!</h1>
              </div>
              <p className="text-muted-foreground">
                {selectedStore
                  ? `Here's what's happening with ${selectedStore.storeName} today.`
                  : "Select a store from the sidebar to view its dashboard."}
              </p>
            </div>
            <Link to="/products">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create New Product
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          {selectedStore && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => (
                <Card key={stat.label} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </Card>
              ))}
            </div>
          )}


          {/* No Stores Message */}
          {!selectedStore && (
            <Card className="p-12 text-center mb-8">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">No Store Selected</h2>
              <p className="text-muted-foreground mb-6">
                Select a store from the sidebar to view its dashboard.
              </p>
            </Card>
          )}

          {/* Products Display (Store Products from backend) */}
          {selectedStore && storeProducts.length > 0 ? (
            <Card className="p-0 overflow-hidden">
              <div className="px-6 pt-6 pb-4 flex flex-col gap-2">
                <h2 className="text-xl font-bold">Your Products</h2>
                <p className="text-sm text-muted-foreground">
                  Manage drafts saved from the designer. Publish them to your storefront when ready.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-t text-sm">
                  <thead className="bg-muted/60 text-muted-foreground">
                    <tr className="text-left">
                      <th className="px-6 py-3"><Checkbox
                        checked={selectedProducts.length === storeProducts.length && storeProducts.length > 0}
                        onCheckedChange={(checked) => setSelectedProducts(Boolean(checked) ? storeProducts.map((sp: any) => sp._id) : [])}
                        aria-label="Select all products"
                      /></th>
                      <th className="px-2 py-3 font-medium">Product</th>
                      <th className="px-2 py-3 font-medium hidden md:table-cell">Created</th>
                      <th className="px-2 py-3 font-medium hidden lg:table-cell">Price</th>
                      <th className="px-2 py-3 font-medium hidden lg:table-cell">Mockup</th>
                      <th className="px-2 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {storeProducts.map((sp: any) => {
                      // Extract previewImagesByView - it's an object with mockup IDs as keys and image URLs as values
                      const previewImagesByView = sp.designData?.previewImagesByView || sp.previewImagesByView || {};
                      const previewImageUrls = Object.values(previewImagesByView).filter((url): url is string =>
                        typeof url === 'string' && url.length > 0
                      );
                      const mockup = previewImageUrls[0] || undefined;
                      const isSelected = selectedProducts.includes(sp._id);
                      return (
                        <tr key={sp._id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-3 align-middle">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => setSelectedProducts(prev => Boolean(checked) ? [...new Set([...prev, sp._id])] : prev.filter(id => id !== sp._id))}
                              aria-label={`Select ${sp.title || 'Untitled'}`}
                            />
                          </td>
                          <td className="px-2 py-4 align-middle">
                            <div
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={() => navigate(`/designer/${sp.catalogProductId}`)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  navigate(`/designer/${sp.catalogProductId}`);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              <div className="h-14 w-14 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                                {mockup ? (
                                  <img src={mockup} alt={sp.title || 'Untitled'} className="h-full w-full object-cover" />
                                ) : (
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium leading-tight line-clamp-1">{sp.title || 'Untitled'}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">Status: {sp.status}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-4 align-middle hidden md:table-cell text-muted-foreground">
                            {new Date(sp.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-4 align-middle hidden lg:table-cell text-muted-foreground">
                            ${(sp.sellingPrice ?? 0).toFixed(2)}
                          </td>
                          <td className="px-2 py-4 align-middle hidden lg:table-cell text-muted-foreground">
                            {mockup ? 'Preview saved' : 'No mockup'}
                          </td>
                          <td className="px-2 py-4 align-middle">
                            <div className="flex justify-end gap-2">
                              {/* Publish/Draft toggle */}
                              {sp.status === 'draft' ? (
                                <Button size="sm" variant="outline" onClick={() => handlePublishClick(sp)}>Publish</Button>
                              ) : (
                                <Button size="sm" variant="secondary" onClick={() => updateStoreProduct(sp._id, { status: 'draft' })}>Mark Draft</Button>
                              )}
                              {/* Active toggle */}
                              <Button size="sm" variant="outline" onClick={() => updateStoreProduct(sp._id, { isActive: !sp.isActive })}>
                                {sp.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              {/* Edit in Designer */}
                              <Button size="sm" variant="ghost" onClick={() => navigate(`/designer/${sp.catalogProductId}`)}>
                                Edit
                              </Button>
                              {/* Delete */}
                              <Button size="sm" variant="destructive" onClick={() => deleteStoreProduct(sp._id)}>Delete</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {selectedProducts.length > 0 && (
                <div className="border-t bg-muted/40 px-6 py-4 text-sm text-muted-foreground flex flex-wrap items-center gap-3">
                  <span>{selectedProducts.length} selected</span>
                  <span className="text-xs">Use the actions above to publish, deactivate, or delete.</span>
                </div>
              )}
            </Card>
          ) : selectedStore ? (
            <Card className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">No products yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start by creating your first product. Choose from our catalog and customize it with your designs.
              </p>
              <Link to="/products">
                <Button size="lg">
                  Browse Product Catalog
                </Button>
              </Link>
            </Card>
          ) : null}

          {/* Publish Dialog */}
          <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publish Product</DialogTitle>
                <DialogDescription>
                  Choose which stores to publish "{productToPublish?.title}" to.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-3">
                {stores.map(store => {
                  const storeId = store.id || store._id || '';
                  return (
                    <div key={storeId} className="flex items-center space-x-2">
                      <Checkbox
                        id={`store-${storeId}`}
                        checked={targetStoreIds.includes(storeId)}
                        onCheckedChange={(checked) => {
                          setTargetStoreIds(prev => {
                            if (checked) return [...prev, storeId];
                            return prev.filter(id => id !== storeId);
                          });
                        }}
                      />
                      <label
                        htmlFor={`store-${storeId}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                      >
                        <span>{store.storeName}</span>
                        {selectedStore && (selectedStore.id === storeId || selectedStore._id === storeId) && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
                <Button onClick={confirmPublish} disabled={targetStoreIds.length === 0}>
                  Publish to {targetStoreIds.length} Store{targetStoreIds.length !== 1 ? 's' : ''}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
