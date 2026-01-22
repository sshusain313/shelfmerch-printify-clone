import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import {
  Package,
  Store,
  TrendingUp,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  FileText,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { stores, selectedStore, selectStoreById, loading: storesLoading } = useStore();
  const location = useLocation();

  // Determine which nav item is active based on current route
  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card p-6">
        <Link to="/" className="flex items-center space-x-2 mb-4">
          <span className="font-heading text-xl font-bold text-foreground">
            Shelf<span className="text-primary">Merch</span>
          </span>
        </Link>

        {/* Store Switcher in sidebar */}
        <div className="pb-4 mb-4 border-b">
          {storesLoading ? (
            <p className="text-xs text-muted-foreground">Loading stores...</p>
          ) : stores.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-2 py-2">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    <div className="text-left">
                      <p className="font-medium text-sm">
                        {selectedStore?.storeName || 'Select Store'}
                      </p>
                      {selectedStore && (
                        <p className="text-xs text-muted-foreground">
                          {selectedStore.subdomain}.shelfmerch.com
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel>Switch Store</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {stores.map((store) => {
                  const isSelected =
                    selectedStore &&
                    ((selectedStore.id === store.id || selectedStore._id === store._id) ||
                      (selectedStore.id === store._id || selectedStore._id === store.id));

                  return (
                    <DropdownMenuItem
                      key={store.id || store._id}
                      onClick={() => selectStoreById(store.id || store._id || '')}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{store.storeName}</span>
                        <span className="text-xs text-muted-foreground">
                          {store.subdomain}.shelfmerch.com
                        </span>
                      </div>
                      {isSelected && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/stores" className="cursor-pointer">
                    <Store className="h-4 w-4 mr-2" />
                    Manage Stores
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <p className="text-xs text-muted-foreground">
              No stores yet. <Link to="/stores" className="underline">Create one</Link>.
            </p>
          )}
        </div>

        <nav className="space-y-2">
          <Button
            variant={isActiveRoute('/dashboard') ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            asChild
          >
            <Link to="/dashboard">
              <Package className="mr-2 h-4 w-4" />
              My Products
            </Link>
          </Button>
          <Button
            variant={isActiveRoute('/orders') ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            asChild
          >
            <Link to="/orders">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Orders
            </Link>
          </Button>
          <Button
            variant={isActiveRoute('/invoices') ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            asChild
          >
            <Link to="/invoices">
              <FileText className="mr-2 h-4 w-4" />
              Wallet & Invoices
            </Link>
          </Button>
          <Button
            variant={isActiveRoute('/customers') ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            asChild
          >
            <Link to="/customers">
              <Users className="mr-2 h-4 w-4" />
              Customers
            </Link>
          </Button>
          {/* <Button
            variant={isActiveRoute('/stores') ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            asChild
          >
            <Link to="/stores">
              <Store className="mr-2 h-4 w-4" />
              Manage Stores
            </Link>
          </Button> */}
          <Button
            variant={isActiveRoute('/analytics') ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            asChild
          >
            <Link to="/analytics">
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </Link>
          </Button>
          {isAdmin && (
            <Button
              variant={isActiveRoute('/admin') ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              asChild
            >
              <Link to="/admin">
                <Users className="mr-2 h-4 w-4" />
                Admin Panel
              </Link>
            </Button>
          )}
          <Button
            variant={isActiveRoute('/settings') ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            asChild
          >
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
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;

