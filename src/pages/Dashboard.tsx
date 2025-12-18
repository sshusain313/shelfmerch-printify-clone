import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Package, 
  Store, 
  TrendingUp, 
  DollarSign,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Plus
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Product } from '@/types';
import { storeProductsApi } from '@/lib/api';
import { storeOrdersApi } from '@/lib/api';
import { getProducts } from '@/lib/localStorage';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Order } from '@/types';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [storageUsage, setStorageUsage] = useState<{ used: number; limit: number } | null>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [spLoading, setSpLoading] = useState(false);
  const [spFilter, setSpFilter] = useState<{ status?: 'draft' | 'published'; isActive?: boolean }>({});

  const storageKey = useMemo(() => (user?.id ? `products_${user.id}` : null), [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setProducts([]);
      setSelectedProducts([]);
      return;
    }

    const loadProducts = () => {
      const loadedProducts = getProducts(user.id);
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
  }, [user?.id, storageKey]);

  // Load Store Products from backend
  useEffect(() => {
    const loadSP = async () => {
      if (!user?.id) {
        setStoreProducts([]);
        return;
      }
      try {
        setSpLoading(true);
        const resp = await storeProductsApi.list(spFilter);
        if (resp.success) setStoreProducts(resp.data || []);
      } catch (e) {
        console.error('Failed to load store products', e);
      } finally {
        setSpLoading(false);
      }
    };
    loadSP();
  }, [user?.id, spFilter]);

  // Load Orders from backend
  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        setSpLoading(true);
        const data = await storeOrdersApi.listForMerchant();
        if (isMounted) {
          setOrders(data);
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
  }, []);

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
    { label: 'Total Orders', value: `${orders.length}` , icon: ShoppingBag, color: 'text-primary' },
    { label: 'Products', value: `${storeProducts.length}`, icon: Package, color: 'text-blue-500' },
    { label: 'Revenue', value: '$0', icon: DollarSign, color: 'text-green-500' },
    { label: 'Profit', value: '$0', icon: TrendingUp, color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card p-6">
        <Link to="/" className="flex items-center space-x-2 mb-8">
          <span className="font-heading text-xl font-bold text-foreground">
            Shelf<span className="text-primary">Merch</span>
          </span>
        </Link>

        <nav className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <Package className="mr-2 h-4 w-4" />
            My Products
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/orders">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Orders
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/stores">
              <Store className="mr-2 h-4 w-4" />
              My Stores
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/analytics">
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </Link>
          </Button>
          {isAdmin && (
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/admin">
                <Users className="mr-2 h-4 w-4" />
                Admin Panel
              </Link>
            </Button>
          )}

          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="border-t pt-4 space-y-2">
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="text-sm font-medium">{user?.email}</p>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening with your store today.
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

          {/* Products Display (Store Products from backend) */}
          {storeProducts.length > 0 ? (
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
                        onCheckedChange={(checked) => setSelectedProducts(Boolean(checked) ? storeProducts.map((sp:any) => sp._id) : [])}
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
                      const mockup = sp.galleryImages?.find((img: any) => img.isPrimary)?.url || sp.galleryImages?.[0]?.url;
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
                                <Button size="sm" variant="outline" onClick={() => updateStoreProduct(sp._id, { status: 'published' })}>Publish</Button>
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
          ) : (
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
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
