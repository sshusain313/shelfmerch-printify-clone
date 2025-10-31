import { Link } from 'react-router-dom';
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
import { useEffect, useState } from 'react';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const loadProducts = () => {
      const savedProducts = localStorage.getItem('shelfmerch_saved_products');
      if (savedProducts) {
        const allProducts = JSON.parse(savedProducts);
        setProducts(allProducts.filter((p: any) => p.userId === user?.id));
      }
    };

    loadProducts();

    // Listen for real-time updates
    const handleUpdate = (event: any) => {
      if (event.detail?.type === 'product') {
        loadProducts();
      }
    };

    window.addEventListener('shelfmerch-data-update', handleUpdate);
    return () => window.removeEventListener('shelfmerch-data-update', handleUpdate);
  }, [user]);

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
          <Button variant="secondary" className="w-full justify-start">
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
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Your Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="aspect-square bg-muted relative">
                      {product.mockupUrl ? (
                        <img
                          src={product.mockupUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Preview
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(product.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
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
