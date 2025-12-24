import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getStoreUrl } from '@/utils/storeUrl';
import { storeApi } from '@/lib/api';
import type { Store } from '@/types';
import { toast } from 'sonner';
import {
  Store as StoreIcon,
  ExternalLink,
  Search,
  Loader2,
  Paintbrush,
  CheckCircle2,
  Package,
  TrendingUp,
} from 'lucide-react';

const PopupStores = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const response = await storeApi.listMyStores();
        if (response.success) {
          const storesData = response.data || [];
          setStores(storesData);
          setFilteredStores(storesData);
        }
      } catch (err: any) {
        console.error('Error fetching stores:', err);
        toast.error('Failed to load stores: ' + (err?.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStores();
    }
  }, [user]);

  // Filter stores based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStores(stores);
      return;
    }

    const filtered = stores.filter(
      (store) =>
        store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStores(filtered);
  }, [searchTerm, stores]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading stores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pop-Up Stores</h1>
            <p className="text-muted-foreground mt-2">
              Manage and view all your pop-up stores
            </p>
          </div>
          <Button onClick={() => navigate('/stores')} variant="outline">
            Back to Stores
          </Button>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stores by name, subdomain, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
              <StoreIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stores.length}</div>
              <p className="text-xs text-muted-foreground">All your stores</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Stores</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stores.filter((s) => s.useBuilder || s.productIds?.length > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">Stores with content</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stores.reduce((sum, s) => sum + (s.productIds?.length || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all stores</p>
            </CardContent>
          </Card>
        </div>

        {/* Stores Grid */}
        {filteredStores.length === 0 ? (
          <Card className="p-12 text-center">
            <StoreIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No stores found' : 'No stores yet'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Create your first store to start selling your products'}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/stores')} className="gap-2">
                <StoreIcon className="h-4 w-4" />
                Go to Stores
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredStores.map((store) => (
              <Card
                key={store.id}
                className="p-6 flex flex-col justify-between gap-4 border-l-4 border-l-primary hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{store.storeName}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {store.subdomain}.shelfmerch.com
                    </p>
                    {store.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {store.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {store.useBuilder && (
                      <Badge
                        variant="secondary"
                        className="text-xs flex items-center gap-1 bg-green-100 text-green-700 border-green-200"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Builder
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      Active
                    </Badge>
                  </div>
                </div>

                {/* Store Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    <span>{store.productIds?.length || 0} products</span>
                  </div>
                  {store.builderLastPublishedAt && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs">
                        Published {new Date(store.builderLastPublishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <a
                        href={getStoreUrl(store.subdomain)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visit Store
                      </a>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/dashboard`)}
                    >
                      Dashboard
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/stores/${store.id}/builder`)}
                  >
                    <Paintbrush className="w-4 h-4 mr-2" />
                    Customize Storefront
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PopupStores;



