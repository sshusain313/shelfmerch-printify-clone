import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CloudUpgradePrompt } from '@/components/CloudUpgradePrompt';
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
import { getProducts } from '@/lib/localStorage';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [storageUsage, setStorageUsage] = useState<{ used: number; limit: number } | null>(null);

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
    { label: 'Total Orders', value: '0', icon: ShoppingBag, color: 'text-primary' },
    { label: 'Products', value: products.length.toString(), icon: Package, color: 'text-blue-500' },
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

          {/* Cloud Upgrade Prompt */}
          <div className="mb-8">
            <CloudUpgradePrompt />
          </div>

          {/* Storage warning */}
          {storageUsage && storageUsage.used > storageUsage.limit * 0.9 && (
            <Card className="mb-6 border-amber-300 bg-amber-50 text-amber-900">
              <div className="p-4 flex flex-col gap-2">
                <p className="font-semibold">Storage Nearly Full</p>
                <p className="text-sm">
                  Your saved products are using {formatBytes(storageUsage.used)} of the available{' '}
                  {formatBytes(storageUsage.limit)} local storage. Consider removing unused drafts to avoid sync issues.
                </p>
              </div>
            </Card>
          )}

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

          {/* Products Display */}
          {products.length > 0 ? (
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
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
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
                    {products.map((product) => {
                      const mockup = product.mockupUrls?.[0] || product.mockupUrl;
                      const isSelected = selectedProducts.includes(product.id);
                      return (
                        <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-3 align-middle">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleSelectProduct(product.id, Boolean(checked))}
                              aria-label={`Select ${product.name}`}
                            />
                          </td>
                          <td className="px-2 py-4 align-middle">
                            <div
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={() => handleProductClick(product)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  handleProductClick(product);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              <div className="h-14 w-14 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                                {mockup ? (
                                  <img src={mockup} alt={product.name} className="h-full w-full object-cover" />
                                ) : (
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium leading-tight line-clamp-1">{product.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  Base: {product.baseProduct}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-4 align-middle hidden md:table-cell text-muted-foreground">
                            {new Date(product.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-2 py-4 align-middle hidden lg:table-cell text-muted-foreground">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="px-2 py-4 align-middle hidden lg:table-cell text-muted-foreground">
                            {mockup ? 'Preview saved' : 'No mockup'}
                          </td>
                          <td className="px-2 py-4 align-middle">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleProductClick(product)}
                                aria-label={`Edit ${product.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => navigate(`/store/${user?.id ?? 'me'}/builder`)}
                                aria-label="Open store builder"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                                disabled
                                aria-label="Delete product (coming soon)"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                  <span className="text-xs">
                    Bulk publish and delete actions will be available soon.
                  </span>
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
