import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ManageStoreDialog from '@/components/ManageStoreDialog';
import { storeApi } from '@/lib/api';
import type { Store as StoreType } from '@/types';
import {
  Package,
  Store,
  TrendingUp,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Plus,
  ExternalLink
} from 'lucide-react';

const Stores = () => {
  const { user, logout, isAdmin } = useAuth();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await storeApi.listMyStores();
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch stores');
        }
        setStores(response.data || []);
      } catch (err: any) {
        console.error('Error fetching stores:', err);
        setError(err.message || 'Failed to fetch stores');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

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
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/dashboard">
              <Package className="mr-2 h-4 w-4" />
              My Products
            </Link>
          </Button>

          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/orders">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Orders
            </Link>
          </Button>

          <Button variant="secondary" className="w-full justify-start">
            <Store className="mr-2 h-4 w-4" />
            My Stores
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
              <h1 className="text-3xl font-bold">My Stores</h1>
              <p className="text-muted-foreground mt-1">
                Manage your ShelfMerch storefronts
              </p>
            </div>
            <Link to="/create-store">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Create New Store
              </Button>
            </Link>
          </div>

          {/* Stores Grid */}
          {loading ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Loading your stores...</p>
            </Card>
          ) : error ? (
            <Card className="p-12 text-center">
              <h2 className="text-2xl font-bold mb-2">Unable to load stores</h2>
              <p className="text-muted-foreground mb-2">{error}</p>
              <p className="text-xs text-muted-foreground">
                Please refresh the page or try again later.
              </p>
            </Card>
          ) : stores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <Card key={store.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{store.storeName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {store.subdomain}.shelfmerch.com
                      </p>
                    </div>
                    <Store className="h-8 w-8 text-primary" />
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(store.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      Theme: {store.theme}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="default" size="sm" asChild>
                      <Link to={`/store/${store.subdomain}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit
                      </Link>
                    </Button>

                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/stores/${store.id}/builder`}>Builder</Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStore(store);
                        setManageDialogOpen(true);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">No stores yet</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first ShelfMerch store to start selling your custom products online.
              </p>
              <Link to="/create-store">
                <Button size="lg">Create Your First Store</Button>
              </Link>
            </Card>
          )}
        </div>
      </main>

      {/* Manage Store Dialog */}
      <ManageStoreDialog
        open={manageDialogOpen}
        onClose={() => setManageDialogOpen(false)}
        store={selectedStore}
      />
    </div>
  );
};

export default Stores;
