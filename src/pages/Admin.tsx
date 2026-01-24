import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Product, Order, Store as StoreType } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  Users,
  Package,
  Palette,
  Store,
  TrendingUp,
  Settings,
  LogOut,
  Search,
  Filter,
  Download,
  ShoppingBag,
  DollarSign,
  Globe,
  Truck,
  AlertTriangle,
  Bell,
  MessageSquare,
  Ban,
  CheckCircle,
  XCircle,
  Edit,
  BarChart3,
  Megaphone,
  HelpCircle,
  FileText,
  Mail,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  ChevronRight,
  Wallet,
  Shield,
  Plus
} from 'lucide-react';
import { WalletManagement } from '@/components/admin/WalletManagement';
import { InvoiceManagement } from '@/components/admin/InvoiceManagement';
import { AuditLogs } from '@/components/admin/AuditLogs';
import { PayoutManagement } from '@/components/admin/PayoutManagement';
import { productApi, storeOrdersApi } from '@/lib/api';
import { storeApi } from '@/lib/api';
import { toast } from 'sonner';
import { CatalogToolbar } from '@/components/admin/CatalogToolbar';
import { BaseProductsTable } from '@/components/admin/BaseProductsTable';

const Admin = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    // Check URL params for tab
    const tabParam = searchParams.get('tab');
    return tabParam || 'overview';
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [announcementText, setAnnouncementText] = useState('');
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  // Products from database
  const [databaseProducts, setDatabaseProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsSearchQuery, setProductsSearchQuery] = useState('');
  const [productsPage, setProductsPage] = useState(1);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsCount, setProductsCount] = useState<number>(0); // For stats display
  const [isLoadingProductsCount, setIsLoadingProductsCount] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storesPage, setStoresPage] = useState(1);
  const [storesLimit, setStoresLimit] = useState(10);
  const [storesTotal, setStoresTotal] = useState(0);
  const [storesSortBy, setStoresSortBy] = useState('createdAt');
  const [storesSortOrder, setStoresSortOrder] = useState<'asc' | 'desc'>('desc');
  const [suspendingStoreId, setSuspendingStoreId] = useState<string | null>(null);
  const [isSuspendingStore, setIsSuspendingStore] = useState(false);

  // Admin sees ALL data across platform (stores/products from localStorage snapshot)
  const allStores = JSON.parse(localStorage.getItem('shelfmerch_all_stores') || '[]') as StoreType[];
  const allProducts = JSON.parse(localStorage.getItem('shelfmerch_all_products') || '[]') as Product[];

  // Live platform orders for Admin Orders tab (superadmin only)
  const [platformOrders, setPlatformOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  
  // Orders filter states
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<string>('all');
  const [ordersAmountSort, setOrdersAmountSort] = useState<string>('none');
  const [ordersAlphabeticalSort, setOrdersAlphabeticalSort] = useState<string>('none');

  // Platform Statistics
  const [adminStats, setAdminStats] = useState<{
    totalRevenue: number;
    totalOrders: number;
    deliveredOrders: number;
    monthlyRevenue: number;
    monthlyOrders: number;
    topProducts: any[];
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Derive effective stores list: prefer backend data when available, otherwise fall back to local snapshot
  const effectiveStores: StoreType[] = !error && stores.length > 0 ? stores : allStores;

  // Calculate real stats from data
  const totalRevenue = adminStats?.totalRevenue || 0;
  const activeStores = effectiveStores.length;
  const totalProducts = allProducts.length;
  const pendingOrders = platformOrders.filter(o => o.status === 'on-hold').length;

  const statusOptions: Array<{ value: Order['status']; label: string }> = [
    { value: 'on-hold', label: 'On hold' },
    { value: 'in-production', label: 'In production' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // Fetch total user count from backend
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const { authApi } = await import('@/lib/api');
        const response = await authApi.getUserCount();
        // The apiRequest returns the full response object for auth endpoints
        if (response && typeof response.count === 'number') {
          setTotalUsers(response.count);
        } else if (response && response.success && typeof response.count === 'number') {
          setTotalUsers(response.count);
        }
      } catch (error) {
        console.error('Failed to fetch user count:', error);
        // Fallback to stores length if API fails
        setTotalUsers(allStores.length);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (user?.role === 'superadmin') {
      fetchUserCount();
    } else {
      // If not admin, just show stores length
      setTotalUsers(allStores.length);
      setIsLoadingUsers(false);
    }
  }, [user?.role, allStores.length]);

  // Fetch products count from backend for stats
  useEffect(() => {
    const fetchProductsCount = async () => {
      if (user?.role !== 'superadmin') {
        return;
      }

      setIsLoadingProductsCount(true);
      try {
        // Fetch with minimal limit to get just the pagination info
        const response = await productApi.getAll({
          page: 1,
          limit: 1,
        });

        if (response && response.success !== false) {
          const pagination = response.pagination || { total: 0 };
          setProductsCount(pagination.total || 0);
        } else {
          // Fallback to localStorage count if API fails
          setProductsCount(totalProducts);
        }
      } catch (error) {
        console.error('Failed to fetch products count:', error);
        // Fallback to localStorage count if API fails
        setProductsCount(totalProducts);
      } finally {
        setIsLoadingProductsCount(false);
      }
    };

    fetchProductsCount();
  }, [user?.role, totalProducts]);

  // Fetch platform-wide orders for Orders tab (superadmin)
  useEffect(() => {
    const fetchOrders = async () => {
      if (user?.role !== 'superadmin') return;
      if (activeTab !== 'orders') return;

      setIsLoadingOrders(true);
      setOrdersError(null);
      try {
        const data = await storeOrdersApi.listForMerchant();
        setPlatformOrders(Array.isArray(data) ? data : []);
      } catch (error: any) {
        console.error('Failed to fetch platform orders:', error);
        setOrdersError(error?.message || 'Failed to load orders');
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user?.role, activeTab]);

  // Filter and sort orders based on all criteria
  const filteredOrders = useMemo(() => {
    let filtered = [...platformOrders];

    // Apply search filter
    if (ordersSearchQuery.trim()) {
      const query = ordersSearchQuery.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        // Search by customer email
        const emailMatch = order.customerEmail?.toLowerCase().includes(query);
        
        // Search by store name (from order.storeId)
        let storeName = '';
        if (order.storeId && typeof order.storeId === 'object' && order.storeId !== null) {
          storeName = (order.storeId as { name?: string }).name || '';
        }
        const storeMatch = storeName.toLowerCase().includes(query);

        return emailMatch || storeMatch;
      });
    }

    // Apply status filter
    if (ordersStatusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === ordersStatusFilter);
    }

    // Apply amount sorting
    if (ordersAmountSort !== 'none') {
      filtered.sort((a, b) => {
        const amountA = a.total !== undefined ? a.total : 0;
        const amountB = b.total !== undefined ? b.total : 0;
        
        if (ordersAmountSort === 'low-high') {
          return amountA - amountB;
        } else if (ordersAmountSort === 'high-low') {
          return amountB - amountA;
        }
        return 0;
      });
    }

    // Apply alphabetical sorting
    if (ordersAlphabeticalSort !== 'none') {
      filtered.sort((a, b) => {
        let compareA = '';
        let compareB = '';

        if (ordersAlphabeticalSort === 'store-az' || ordersAlphabeticalSort === 'store-za') {
          // Sort by store name
          let storeNameA = '';
          let storeNameB = '';
          if (a.storeId && typeof a.storeId === 'object' && a.storeId !== null) {
            storeNameA = (a.storeId as { name?: string }).name || '';
          }
          if (b.storeId && typeof b.storeId === 'object' && b.storeId !== null) {
            storeNameB = (b.storeId as { name?: string }).name || '';
          }
          compareA = storeNameA.toLowerCase();
          compareB = storeNameB.toLowerCase();
        } else if (ordersAlphabeticalSort === 'email-az' || ordersAlphabeticalSort === 'email-za') {
          // Sort by customer email
          compareA = (a.customerEmail || '').toLowerCase();
          compareB = (b.customerEmail || '').toLowerCase();
        }

        const comparison = compareA.localeCompare(compareB);
        
        if (ordersAlphabeticalSort === 'store-za' || ordersAlphabeticalSort === 'email-za') {
          return -comparison; // Reverse for Z-A
        }
        return comparison; // A-Z
      });
    }

    return filtered;
  }, [platformOrders, ordersSearchQuery, ordersStatusFilter, ordersAmountSort, ordersAlphabeticalSort]);

  // Fetch admin dashboard statistics
  useEffect(() => {
    const fetchAdminStats = async () => {
      if (user?.role !== 'superadmin' || activeTab !== 'overview') return;

      setIsLoadingStats(true);
      try {
        // TODO: Implement getAdminStats API endpoint
        // const response = await storeOrdersApi.getAdminStats();
        // if (response.success) {
        //   setAdminStats(response.data);
        // }
        // For now, set empty stats
        setAdminStats(null);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchAdminStats();
  }, [user?.role, activeTab]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...databaseProducts];

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(p => p.isActive);
      } else if (statusFilter === 'archived') {
        filtered = filtered.filter(p => !p.isActive);
      }
      // TODO: Add draft status filtering when draft status is implemented
    }

    // Apply category filter (placeholder - can be enhanced when categories are added)
    // For now, category filter doesn't do anything

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'price-low':
          return (a.catalogue?.basePrice || 0) - (b.catalogue?.basePrice || 0);
        case 'price-high':
          return (b.catalogue?.basePrice || 0) - (a.catalogue?.basePrice || 0);
        case 'newest':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    return filtered;
  }, [databaseProducts, statusFilter, categoryFilter, sortBy]);

  // Fetch products from database
  const fetchProducts = useCallback(async () => {
    if (activeTab !== 'products') {
      return;
    }

    if (user?.role !== 'superadmin') {
      return;
    }

    console.log('Fetching products from database...', { productsPage, productsSearchQuery });
    setIsLoadingProducts(true);
    try {
      const response = await productApi.getAll({
        page: productsPage,
        limit: 20,
        search: productsSearchQuery.trim() || undefined,
      });

      console.log('Products API response:', response);

      // Handle response structure
      if (response && response.success !== false) {
        const productsArray = Array.isArray(response.data) ? response.data : [];
        const pagination = response.pagination || { total: productsArray.length };

        console.log(`Loaded ${productsArray.length} products out of ${pagination.total} total`);
        setDatabaseProducts(productsArray);
        setProductsTotal(pagination.total || productsArray.length);
      } else {
        console.warn('API response indicates failure:', response);
        setDatabaseProducts([]);
        setProductsTotal(0);
      }
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      toast.error(error.message || 'Failed to load products from database');
      setDatabaseProducts([]);
      setProductsTotal(0);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [activeTab, user?.role, productsPage, productsSearchQuery]);

  // Fetch All Stores
  useEffect(() => {
    let isMounted = true;

    const loadStores = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await storeApi.listAllStores({
          page: storesPage,
          limit: storesLimit,
          search: searchQuery,
          sortBy: storesSortBy,
          sortOrder: storesSortOrder
        });

        if (isMounted) {
          if (response.success) {
            setStores(response.data || []);
            if (response.pagination) {
              setStoresTotal(response.pagination.total);
            }
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load stores');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      loadStores();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [storesPage, storesLimit, searchQuery, storesSortBy, storesSortOrder]);


  // Update URL when tab changes
  useEffect(() => {
    if (activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    // Fetch immediately when tab becomes active or page changes
    if (activeTab === 'products' && user?.role === 'superadmin') {
      if (productsSearchQuery) {
        // Debounce search query
        const timeoutId = setTimeout(() => {
          fetchProducts();
        }, 500);
        return () => clearTimeout(timeoutId);
      } else {
        // Fetch immediately for page changes or initial load
        fetchProducts();
      }
    }
  }, [activeTab, productsPage, productsSearchQuery, user?.role, fetchProducts]);

  // Handle suspending/unsuspending a store
  const handleSuspendStore = async () => {
    if (!suspendingStoreId) return;

    try {
      setIsSuspendingStore(true);
      // TODO: Implement suspend API endpoint
      // const response = await storeApi.suspend(suspendingStoreId);
      // For now, use update method to toggle isActive status
      const store = stores.find(s => s.id === suspendingStoreId);
      if (store) {
        const response = await storeApi.update(suspendingStoreId, {
          // Note: This may need to be adjusted based on actual API structure
        });
        if (response.success) {
          toast.success(response.message || 'Store status updated successfully');
          setSuspendingStoreId(null);
          // Reload stores list
          const updatedResponse = await storeApi.listAllStores({
            page: storesPage,
            limit: storesLimit,
            search: searchQuery,
            sortBy: storesSortBy,
            sortOrder: storesSortOrder
          });
          if (updatedResponse.success) {
            setStores(updatedResponse.data || []);
          }
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update store status');
    } finally {
      setIsSuspendingStore(false);
    }
  };

  const stats = [
    {
      label: 'Monthly Revenue',
      value: isLoadingStats ? '...' : `₹${(adminStats?.monthlyRevenue || 0).toLocaleString()}`,
      change: '+23%',
      trend: 'up',
      icon: DollarSign
    },
    {
      label: 'Active Stores',
      value: `${effectiveStores.length}`,
      change: '+15%',
      trend: 'up',
      icon: Store
    },
    {
      label: 'Base Products',
      value: isLoadingProductsCount ? '...' : (productsCount > 0 ? productsCount.toString() : totalProducts.toString()),
      change: '+8%',
      trend: 'up',
      icon: Package
    },
    {
      label: 'Orders Delivered',
      value: isLoadingStats ? '...' : (adminStats?.deliveredOrders || 0).toString(),
      change: '+12%',
      trend: 'up',
      icon: Truck
    },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 12400, orders: 89 },
    { month: 'Feb', revenue: 15800, orders: 112 },
    { month: 'Mar', revenue: 19200, orders: 145 },
    { month: 'Apr', revenue: 22100, orders: 167 },
    { month: 'May', revenue: 28400, orders: 198 },
    { month: 'Jun', revenue: 32600, orders: 234 },
  ];

  const regionData = [
    { name: 'North America', value: 45, color: 'hsl(var(--primary))' },
    { name: 'Europe', value: 30, color: 'hsl(var(--accent-foreground))' },
    { name: 'Asia', value: 18, color: 'hsl(159 58% 60%)' },
    { name: 'Others', value: 7, color: 'hsl(var(--muted-foreground))' },
  ];

  const topProducts = adminStats?.topProducts?.map(p => ({
    id: p._id,
    name: p.storeName || p.name || 'Unknown',
    sales: p.salesCount || 0,
    revenue: p.revenue || 0,
    imageUrl: p.imageUrl || p.mockupUrl || '', // Support both imageUrl and mockupUrl
    userId: p.userId || p.storeId || '' // Support both userId and storeId
  })) || [];

  const fulfillmentPartners = [
    { id: 2, name: 'EuroFulfill', status: 'active', performance: 95, avgTime: '3.1 days', orders: 892 },
    { id: 3, name: 'AsiaPress', status: 'warning', performance: 87, avgTime: '4.2 days', orders: 567 },
    { id: 4, name: 'QuickShip Global', status: 'active', performance: 96, avgTime: '2.8 days', orders: 1034 },
  ];

  const supportTickets = [
    { id: 'TKT-001', user: 'john@example.com', subject: 'Payment issue', priority: 'high', status: 'open' },
    { id: 'TKT-002', user: 'jane@example.com', subject: 'Product quality question', priority: 'medium', status: 'in-progress' },
    { id: 'TKT-003', user: 'mike@example.com', subject: 'Shipping delay', priority: 'high', status: 'open' },
    { id: 'TKT-004', user: 'sara@example.com', subject: 'Account access', priority: 'low', status: 'resolved' },
  ];

  const alerts = [
    { id: 1, type: 'warning', message: 'High order volume in North America region', time: '2h ago' },
    { id: 2, type: 'error', message: 'Fulfillment delay from AsiaPress partner', time: '5h ago' },
    { id: 3, type: 'info', message: '3 new stores pending approval', time: '1d ago' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b bg-card z-50 px-6">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-heading text-xl font-bold">
                Shelf<span className="text-primary">Merch</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/products">Catalog</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="#pricing">Pricing</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="#support">Support</a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="#help">Help Center</a>
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {alerts.length > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>System Alerts</DialogTitle>
                  <DialogDescription>Recent platform notifications</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex gap-3 p-3 rounded-lg border">
                      {alert.type === 'error' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                      {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                      {alert.type === 'info' && <Bell className="h-5 w-5 text-primary" />}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex items-center gap-2 border-l pl-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 border-r bg-card p-6 overflow-y-auto">
        <div className="mb-6 p-3 bg-primary/10 rounded-lg">
          <p className="text-xs font-semibold text-primary">SUPER ADMIN</p>
        </div>

        <nav className="space-y-6">
          {/* Core */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Core
            </p>
            <Button
              variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeTab === 'overview' && "bg-secondary font-semibold"
              )}
              onClick={() => setActiveTab('overview')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'products' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start relative",
                activeTab === 'products' && "bg-secondary font-semibold before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary before:rounded-r"
              )}
              onClick={() => setActiveTab('products')}
            >
              <Package className="mr-2 h-4 w-4" />
              Product Catalog
            </Button>
            <Button
              variant={activeTab === 'orders' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeTab === 'orders' && "bg-secondary font-semibold"
              )}
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Orders
            </Button>
            <Button
              variant={activeTab === 'fulfillment' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeTab === 'fulfillment' && "bg-secondary font-semibold"
              )}
              onClick={() => setActiveTab('fulfillment')}
            >
              <Truck className="mr-2 h-4 w-4" />
              Fulfillment
            </Button>
          </div>

          {/* Finance */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Finance
            </p>
            <Button
              variant={activeTab === 'wallets' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeTab === 'wallets' && "bg-secondary font-semibold"
              )}
              onClick={() => setActiveTab('wallets')}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Wallets
            </Button>
            <Button
              variant={activeTab === 'invoices' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeTab === 'invoices' && "bg-secondary font-semibold"
              )}
              onClick={() => setActiveTab('invoices')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Invoices
            </Button>
          </div>

          {/* Platform */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Platform
            </p>
            <Button
              variant={activeTab === 'stores' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeTab === 'stores' && "bg-secondary font-semibold"
              )}
              onClick={() => setActiveTab('stores')}
            >
              <Store className="mr-2 h-4 w-4" />
              Active Stores
            </Button>
            <Button
              variant={activeTab === 'users' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeTab === 'users' && "bg-secondary font-semibold"
              )}
              onClick={() => setActiveTab('users')}
            >
              <Users className="mr-2 h-4 w-4" />
              User Management
            </Button>
            <Button
              variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeTab === 'settings' && "bg-secondary font-semibold"
              )}
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Platform Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              asChild
            >
              <Link to="/admin/variant-options">
                <Package className="mr-2 h-4 w-4" />
                Variant Options
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              asChild
            >
              <Link to="/admin/assets">
                <Palette className="mr-2 h-4 w-4" />
                Design Assets
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              asChild
            >
              <Link to="/admin/catalogue-fields">
                <FileText className="mr-2 h-4 w-4" />
                Catalogue Fields
              </Link>
            </Button>
            <Button
              variant={activeTab === 'audit' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeTab === 'audit' && "bg-secondary font-semibold"
              )}
              onClick={() => setActiveTab('audit')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Audit Logs
            </Button>
          </div>

          {/* Insights & Marketing */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Insights
            </p>
            <Button
              variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeTab === 'analytics' && "bg-secondary font-semibold"
              )}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button
              variant={activeTab === 'marketing' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeTab === 'marketing' && "bg-secondary font-semibold"
              )}
              onClick={() => setActiveTab('marketing')}
            >
              <Megaphone className="mr-2 h-4 w-4" />
              Marketing
            </Button>
            <Button
              variant={activeTab === 'support' ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start",
                activeTab === 'support' && "bg-secondary font-semibold"
              )}
              onClick={() => setActiveTab('support')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Support
            </Button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 mt-16 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Platform Overview</h1>
                  <p className="text-muted-foreground mt-1">
                    Monitor your print-on-demand business at a glance
                  </p>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon className="h-8 w-8 text-primary" />
                        <div className="flex items-center gap-1">
                          {stat.trend === 'up' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-destructive" />
                          )}
                          <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-500' : 'text-destructive'}`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Monthly revenue and order volume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sales by Region</CardTitle>
                    <CardDescription>Global distribution of orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={regionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="hsl(var(--primary))"
                          dataKey="value"
                        >
                          {regionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top Products */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Top Performing Products</CardTitle>
                  <CardDescription>Best sellers this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Sales</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.imageUrl && (
                                <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded object-cover" />
                              )}
                              <span className="font-medium">{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{product.sales} units</TableCell>
                          <TableCell>₹{product.revenue.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {product.userId 
                                ? allStores.find(s => s.userId === product.userId)?.storeName || 'Unknown'
                                : 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {/* Stores Tab */}
          {activeTab === 'stores' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Active Stores</h1>
                  <p className="text-muted-foreground mt-1">
                    Manage all merchant stores on the platform
                  </p>
                </div>
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Store Data
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>All Stores ({storesTotal})</CardTitle>
                      <CardDescription>Monitor and manage merchant storefronts</CardDescription>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search stores..."
                        className="pl-9 w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading && stores.length === 0 ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8 text-red-500">{error}</div>
                  ) : (
                    <>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Store ID</TableHead>
                              <TableHead>Store Name</TableHead>
                              <TableHead>Owner</TableHead>
                              <TableHead>Created At</TableHead>
                              <TableHead>Products</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Last Updated</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stores.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                  No stores found
                                </TableCell>
                              </TableRow>
                            ) : (
                              stores.map((store) => (
                                <TableRow key={store.id}>
                                  <TableCell className="font-mono text-xs text-muted-foreground">
                                    {store.id.substring(0, 8)}...
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-medium">{store.storeName}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {store.subdomain}.shelfmerch.com
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">{store.owner?.name || 'Unknown'}</div>
                                    <div className="text-xs text-muted-foreground">{store.owner?.email}</div>
                                  </TableCell>
                                  <TableCell>
                                    {store.createdAt ? new Date(store.createdAt).toLocaleDateString() : '-'}
                                  </TableCell>
                                  <TableCell>{store.productsCount || 0}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={store.isActive ? "secondary" : "destructive"}
                                      className={store.isActive ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : ""}
                                    >
                                      {store.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {store.updatedAt ? new Date(store.updatedAt).toLocaleDateString() : '-'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex gap-2 justify-end">
                                      <Button variant="ghost" size="sm" asChild>
                                        <Link to={`/store/${store.subdomain}`}>View</Link>
                                      </Button>
                                      <AlertDialog open={suspendingStoreId === store.id} onOpenChange={(open) => {
                                        if (open) {
                                          setSuspendingStoreId(store.id);
                                        } else {
                                          setSuspendingStoreId(null);
                                        }
                                      }}>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <Ban className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>{store.isActive ? 'Suspend Store?' : 'Reactivate Store?'}</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              {store.isActive
                                                ? 'This will temporarily disable the store and prevent new orders.'
                                                : 'This will reactivate the store and allow new orders.'
                                              }
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleSuspendStore} disabled={isSuspendingStore}>
                                              {isSuspendingStore ? 'Processing...' : (store.isActive ? 'Suspend' : 'Reactivate')}
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {storesTotal > storesLimit && (
                        <div className="mt-4">
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious
                                  onClick={() => setStoresPage(p => Math.max(1, p - 1))}
                                  className={storesPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                              </PaginationItem>

                              {Array.from({ length: Math.min(5, Math.ceil(storesTotal / storesLimit)) }, (_, i) => {
                                const totalPages = Math.ceil(storesTotal / storesLimit);
                                let startPage = Math.max(1, storesPage - 2);
                                if (startPage + 4 > totalPages) {
                                  startPage = Math.max(1, totalPages - 4);
                                }
                                const p = startPage + i;
                                if (p > totalPages) return null;

                                return (
                                  <PaginationItem key={p}>
                                    <PaginationLink
                                      isActive={storesPage === p}
                                      onClick={() => setStoresPage(p)}
                                      className="cursor-pointer"
                                    >
                                      {p}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              })}

                              <PaginationItem>
                                <PaginationNext
                                  onClick={() => setStoresPage(p => Math.min(Math.ceil(storesTotal / storesLimit), p + 1))}
                                  className={storesPage >= Math.ceil(storesTotal / storesLimit) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold">User Management</h1>
                  <p className="text-muted-foreground mt-1">
                    Manage creators, partners, and platform users
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold mt-1">
                          {isLoadingUsers ? '...' : totalUsers}
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Merchants</p>
                        <p className="text-2xl font-bold mt-1">{effectiveStores.length}</p>
                      </div>
                      <Store className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Approval</p>
                        <p className="text-2xl font-bold mt-1">3</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>View and manage platform members</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Stores</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {effectiveStores.map((store) => (
                        <TableRow key={store.userId}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{store.storeName} Owner</p>
                              <p className="text-sm text-muted-foreground">{store.userId}@example.com</p>
                            </div>
                          </TableCell>
                          <TableCell>{1} store</TableCell>
                          <TableCell>₹0</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <Ban className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <>
              {/* Page Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold">Product Catalog</h1>
                  <p className="text-muted-foreground mt-1">
                    Manage platform-wide base products for merchants
                  </p>
                </div>
                <Button asChild className="gap-2">
                  <Link to="/admin/products/new">
                    <Plus className="h-4 w-4" />
                    Add Base Product
                  </Link>
                </Button>
              </div>

              {/* Error Banner */}
              {!isLoadingProducts && databaseProducts.length === 0 && productsSearchQuery && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Could not load base products. Please try again.
                  </p>
                </div>
              )}

              {/* Toolbar */}
              <CatalogToolbar
                searchQuery={productsSearchQuery}
                onSearchChange={(value) => {
                  setProductsSearchQuery(value);
                  setProductsPage(1);
                }}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                totalCount={productsTotal}
                activeCount={databaseProducts.filter(p => p.isActive).length}
                draftCount={0} // TODO: Add draft status to products
                archivedCount={databaseProducts.filter(p => !p.isActive).length}
              />

              {/* Products Table */}
              <div className="mt-4">
                <BaseProductsTable
                  products={filteredAndSortedProducts}
                  isLoading={isLoadingProducts}
                  onEdit={(id) => {
                    window.location.href = `/admin/products/${id}/edit`;
                  }}
                  onDuplicate={(id) => {
                    toast.info('Duplicate functionality coming soon');
                  }}
                  onArchive={async (id) => {
                    try {
                      const response = await productApi.delete(id);
                      if (response && response.success) {
                        toast.success('Product archived successfully');
                      } else {
                        toast.error('Failed to archive product');
                      }
                      // Refresh products list
                      await fetchProducts();
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to archive product');
                    }
                  }}
                  onDelete={async (id) => {
                    try {
                      const response = await productApi.delete(id);
                      if (response && response.success) {
                        toast.success('Product deleted successfully');
                      } else {
                        toast.error('Failed to delete product');
                      }
                      // Refresh products list
                      await fetchProducts();
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to delete product');
                    }
                  }}
                />
              </div>

              {/* Pagination */}
              {productsTotal > 20 && !isLoadingProducts && databaseProducts.length > 0 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {((productsPage - 1) * 20) + 1} to {Math.min(productsPage * 20, productsTotal)} of {productsTotal} products
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductsPage(p => Math.max(1, p - 1))}
                      disabled={productsPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProductsPage(p => p + 1)}
                      disabled={productsPage * 20 >= productsTotal}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Order Management</h1>
                  <p className="text-muted-foreground mt-1">
                    Monitor all platform orders and fulfillment
                  </p>
                </div>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export Orders
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold mt-1">{platformOrders.filter(o => o.status === 'on-hold').length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">In Production</p>
                    <p className="text-2xl font-bold mt-1">{platformOrders.filter(o => o.status === 'in-production').length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Shipped</p>
                    <p className="text-2xl font-bold mt-1">{platformOrders.filter(o => o.status === 'shipped').length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Delivered</p>
                    <p className="text-2xl font-bold mt-1">{platformOrders.filter(o => o.status === 'delivered').length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    className="pl-10"
                    value={ordersSearchQuery}
                    onChange={(e) => setOrdersSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-3 items-center">
                  {/* Status Filter */}
                  <Select value={ordersStatusFilter} onValueChange={setOrdersStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="on-hold">On-hold</SelectItem>
                      <SelectItem value="in-production">In Production</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Amount Sort */}
                  <Select value={ordersAmountSort} onValueChange={setOrdersAmountSort}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort by Amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="low-high">Low → High</SelectItem>
                      <SelectItem value="high-low">High → Low</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Alphabetical Sort */}
                  <Select value={ordersAlphabeticalSort} onValueChange={setOrdersAlphabeticalSort}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort Alphabetically" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="store-az">Store (A → Z)</SelectItem>
                      <SelectItem value="store-za">Store (Z → A)</SelectItem>
                      <SelectItem value="email-az">Email (A → Z)</SelectItem>
                      <SelectItem value="email-za">Email (Z → A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Orders</CardTitle>
                      <CardDescription>Latest platform-wide orders</CardDescription>
                    </div>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export Orders
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ordersError && (
                    <p className="mb-4 text-sm text-destructive">{ordersError}</p>
                  )}
                  {isLoadingOrders ? (
                    <p className="text-sm text-muted-foreground">Loading orders...</p>
                  ) : filteredOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No orders found.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Store</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order: any) => {
                          const orderId = (order.id || order._id || '').toString();
                          const storeName = order.storeId && typeof order.storeId === 'object'
                            ? order.storeId.name
                            : 'Direct';

                          const currentStatus = order.status as Order['status'];

                          const getStatusBadgeClass = (status: Order['status']) => {
                            switch (status) {
                              case 'delivered':
                                return 'bg-green-500/10 text-green-500';
                              case 'shipped':
                                return 'bg-blue-500/10 text-blue-500';
                              case 'in-production':
                                return 'bg-yellow-500/10 text-yellow-500';
                              case 'refunded':
                                return 'bg-purple-500/10 text-purple-500';
                              case 'cancelled':
                                return 'bg-red-500/10 text-red-500';
                              case 'on-hold':
                              default:
                                return 'bg-muted text-muted-foreground';
                            }
                          };

                          return (
                            <TableRow key={orderId || Math.random()}>
                              <TableCell className="font-medium">{orderId ? orderId.slice(0, 8) : '-'}</TableCell>
                              <TableCell>{order.customerEmail}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {storeName || 'Direct'}
                                </Badge>
                              </TableCell>
                              <TableCell>{order.items?.length ?? 0}</TableCell>
                              <TableCell>₹{order.total?.toFixed(2) ?? '0.00'}</TableCell>
                              <TableCell>
                                <Select
                                  value={currentStatus}
                                  onValueChange={async (value) => {
                                    try {
                                      // Normalize status: 'canceled' -> 'cancelled'
                                      const normalizedStatus = value === 'canceled' ? 'cancelled' : value;
                                      const newStatus = normalizedStatus as 'on-hold' | 'in-production' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
                                      await storeOrdersApi.updateStatus(orderId, newStatus);
                                      setPlatformOrders((prev) =>
                                        prev.map((o) => {
                                          const oId = (o as any)._id || (o as any).id;
                                          const targetId = (order as any)._id || (order as any).id;
                                          return oId === targetId
                                            ? { ...o, status: newStatus }
                                            : o;
                                        })
                                      );
                                    } catch (error) {
                                      console.error('Failed to update order status:', error);
                                      toast.error('Failed to update order status');
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-32 h-8 text-xs">
                                    <SelectValue>
                                      <Badge
                                        variant="secondary"
                                        className={getStatusBadgeClass(currentStatus)}
                                      >
                                        {currentStatus}
                                      </Badge>
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {statusOptions.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link to={`/admin/orders/${orderId}`}>
                                    <ChevronRight className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Fulfillment Tab */}
          {activeTab === 'fulfillment' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Fulfillment & Logistics</h1>
                  <p className="text-muted-foreground mt-1">
                    Monitor print partners and delivery performance
                  </p>
                </div>
                <Button className="gap-2">
                  <Truck className="h-4 w-4" />
                  Add Partner
                </Button>
              </div>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Fulfillment Partners</CardTitle>
                  <CardDescription>Active print and shipping providers</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>Avg. Fulfillment</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fulfillmentPartners.map((partner) => (
                        <TableRow key={partner.id}>
                          <TableCell className="font-medium">{partner.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                partner.status === 'active' ? 'bg-green-500/10 text-green-500' :
                                  'bg-yellow-500/10 text-yellow-500'
                              }
                            >
                              {partner.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${partner.performance >= 95 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                  style={{ width: `${partner.performance}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{partner.performance}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{partner.avgTime}</TableCell>
                          <TableCell>{partner.orders.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {/* Support Tab */}
          {activeTab === 'support' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Support & Moderation</h1>
                  <p className="text-muted-foreground mt-1">
                    Manage tickets, reports, and user inquiries
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Open Tickets</p>
                        <p className="text-2xl font-bold mt-1">
                          {supportTickets.filter(t => t.status === 'open').length}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">In Progress</p>
                        <p className="text-2xl font-bold mt-1">
                          {supportTickets.filter(t => t.status === 'in-progress').length}
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Resolved Today</p>
                        <p className="text-2xl font-bold mt-1">
                          {supportTickets.filter(t => t.status === 'resolved').length}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>Recent customer inquiries and issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supportTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.id}</TableCell>
                          <TableCell>{ticket.user}</TableCell>
                          <TableCell>{ticket.subject}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                ticket.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                                  ticket.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                    'bg-muted text-muted-foreground'
                              }
                            >
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                ticket.status === 'resolved' ? 'bg-green-500/10 text-green-500' :
                                  ticket.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500' :
                                    'bg-muted text-muted-foreground'
                              }
                            >
                              {ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}

          {/* Marketing Tab */}
          {activeTab === 'marketing' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Marketing & Announcements</h1>
                  <p className="text-muted-foreground mt-1">
                    Manage platform communications and campaigns
                  </p>
                </div>
              </div>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Send Announcement</CardTitle>
                  <CardDescription>Broadcast message to all stores or specific users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Recipients</label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="merchants">All Merchants</SelectItem>
                        <SelectItem value="active">Active Stores Only</SelectItem>
                        <SelectItem value="custom">Custom Selection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject</label>
                    <Input placeholder="Enter announcement subject" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      placeholder="Write your announcement..."
                      rows={6}
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                    />
                  </div>
                  <Button className="w-full gap-2">
                    <Mail className="h-4 w-4" />
                    Send Announcement
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Previous Announcements</CardTitle>
                  <CardDescription>History of platform communications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { date: '2 days ago', subject: 'New product templates available', recipients: 'All Merchants' },
                      { date: '1 week ago', subject: 'Platform maintenance scheduled', recipients: 'All Users' },
                      { date: '2 weeks ago', subject: 'Shipping rates update', recipients: 'Active Stores' },
                    ].map((announcement, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{announcement.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            Sent to {announcement.recipients} • {announcement.date}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Platform Analytics</h1>
                  <p className="text-muted-foreground mt-1">
                    Detailed insights and performance metrics
                  </p>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Over Time</CardTitle>
                    <CardDescription>Monthly revenue trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Order Volume</CardTitle>
                    <CardDescription>Monthly order count</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics Summary</CardTitle>
                  <CardDescription>Platform performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                      <p className="text-2xl font-bold mt-1">
                        ₹{(totalRevenue / (platformOrders.length || 1)).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fulfillment Rate</p>
                      <p className="text-2xl font-bold mt-1">96%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                      <p className="text-2xl font-bold mt-1">4.8/5.0</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Return Rate</p>
                      <p className="text-2xl font-bold mt-1">2.1%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Wallets Tab */}
          {activeTab === 'wallets' && <WalletManagement />}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && <InvoiceManagement />}

          {/* Audit Logs Tab */}
          {activeTab === 'audit' && <AuditLogs />}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Platform Settings</h1>
                  <p className="text-muted-foreground mt-1">
                    Configure global platform options
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Settings</CardTitle>
                    <CardDescription>Manage payment methods and fees</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Platform Commission</p>
                        <p className="text-sm text-muted-foreground">Percentage taken from each sale</p>
                      </div>
                      <Input className="w-24" defaultValue="15%" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Transaction Fee</p>
                        <p className="text-sm text-muted-foreground">Fixed fee per transaction</p>
                      </div>
                      <Input className="w-24" defaultValue="₹0.30" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Configuration</CardTitle>
                    <CardDescription>Global shipping rates and regions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Domestic Shipping</p>
                        <p className="text-sm text-muted-foreground">Base rate for domestic orders</p>
                      </div>
                      <Input className="w-24" defaultValue="₹5.99" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">International Shipping</p>
                        <p className="text-sm text-muted-foreground">Base rate for international orders</p>
                      </div>
                      <Input className="w-24" defaultValue="₹12.99" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Print Partners Integration</CardTitle>
                    <CardDescription>Connect fulfillment providers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full gap-2">
                      <Globe className="h-4 w-4" />
                      Configure API Integrations
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
