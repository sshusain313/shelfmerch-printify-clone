import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Product, Order, Store as StoreType } from '@/types';
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
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  Users,
  Package,
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
  Wallet
} from 'lucide-react';
import { WalletManagement } from '@/components/admin/WalletManagement';
import { InvoiceManagement } from '@/components/admin/InvoiceManagement';

const Admin = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [announcementText, setAnnouncementText] = useState('');

  // Admin sees ALL data across platform (from localStorage)
  const allStores = JSON.parse(localStorage.getItem('shelfmerch_all_stores') || '[]') as StoreType[];
  const allProducts = JSON.parse(localStorage.getItem('shelfmerch_all_products') || '[]') as Product[];
  const allOrders = JSON.parse(localStorage.getItem('shelfmerch_all_orders') || '[]') as Order[];
  
  // Calculate real stats from data
  const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
  const activeStores = allStores.length;
  const totalProducts = allProducts.length;
  const pendingOrders = allOrders.filter(o => o.status === 'on-hold').length;

  const stats = [
    { 
      label: 'Monthly Revenue', 
      value: `$${totalRevenue.toLocaleString()}`, 
      change: '+23%', 
      trend: 'up',
      icon: DollarSign 
    },
    { 
      label: 'Active Stores', 
      value: activeStores.toString(), 
      change: '+15%', 
      trend: 'up',
      icon: Store 
    },
    { 
      label: 'Total Products', 
      value: totalProducts.toString(), 
      change: '+8%', 
      trend: 'up',
      icon: Package 
    },
    { 
      label: 'Orders Delivered', 
      value: allOrders.filter(o => o.status === 'delivered').length.toString(), 
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

  const topProducts = allProducts.slice(0, 5).map((p, i) => ({
    ...p,
    sales: Math.floor(Math.random() * 500) + 100,
    revenue: Math.floor(Math.random() * 10000) + 2000,
  }));

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

        <nav className="space-y-1">
          <Button 
            variant={activeTab === 'overview' ? 'secondary' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Overview
          </Button>
          <Button 
            variant={activeTab === 'stores' ? 'secondary' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('stores')}
          >
            <Store className="mr-2 h-4 w-4" />
            Active Stores
          </Button>
          <Button 
            variant={activeTab === 'users' ? 'secondary' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('users')}
          >
            <Users className="mr-2 h-4 w-4" />
            User Management
          </Button>
          <Button 
            variant={activeTab === 'products' ? 'secondary' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('products')}
          >
            <Package className="mr-2 h-4 w-4" />
            Product Catalog
          </Button>
          <Button 
            variant={activeTab === 'orders' ? 'secondary' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Orders
          </Button>
          <Button 
            variant={activeTab === 'fulfillment' ? 'secondary' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('fulfillment')}
          >
            <Truck className="mr-2 h-4 w-4" />
            Fulfillment
          </Button>
          <Button 
            variant={activeTab === 'wallets' ? 'secondary' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('wallets')}
          >
            <Wallet className="mr-2 h-4 w-4" />
            Wallets
          </Button>
          <Button 
            variant={activeTab === 'invoices' ? 'secondary' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('invoices')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Invoices
          </Button>
          <Button 
            variant={activeTab === 'support' ? 'secondary' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('support')}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Support
          </Button>
          <Button 
            variant={activeTab === 'marketing' ? 'secondary' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('marketing')}
          >
            <Megaphone className="mr-2 h-4 w-4" />
            Marketing
          </Button>
          <Button 
            variant={activeTab === 'analytics' ? 'secondary' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button 
            variant={activeTab === 'settings' ? 'secondary' : 'ghost'} 
            className="w-full justify-start"
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Platform Settings
          </Button>
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
                              {product.mockupUrl && (
                                <img src={product.mockupUrl} alt={product.name} className="h-10 w-10 rounded object-cover" />
                              )}
                              <span className="font-medium">{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{product.sales} units</TableCell>
                  <TableCell>${product.revenue.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{allStores.find(s => s.userId === product.userId)?.storeName || 'Unknown'}</Badge>
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
                      <CardTitle>All Stores ({allStores.length})</CardTitle>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Store Name</TableHead>
                        <TableHead>Subdomain</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allStores.map((store) => (
                        <TableRow key={store.id}>
                          <TableCell className="font-medium">{store.storeName}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{store.subdomain}.shelfmerch.com</code>
                          </TableCell>
                          <TableCell>{store.userId}</TableCell>
                          <TableCell>{store.productIds.length}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={`/store/${store.subdomain}`}>View</Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Suspend Store?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will temporarily disable the store and prevent new orders.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction>Suspend</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
                        <p className="text-2xl font-bold mt-1">{allStores.length}</p>
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
                        <p className="text-2xl font-bold mt-1">{allStores.length}</p>
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
                      {allStores.map((store) => (
                        <TableRow key={store.userId}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{store.storeName} Owner</p>
                              <p className="text-sm text-muted-foreground">{store.userId}@example.com</p>
                            </div>
                          </TableCell>
                          <TableCell>{1} store</TableCell>
                          <TableCell>$0</TableCell>
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
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold">Product Catalog</h1>
                  <p className="text-muted-foreground mt-1">
                    Manage platform-wide product offerings
                  </p>
                </div>
                <Button asChild>
                  <Link to="/admin/products/new">Add Base Product</Link>
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>All Products ({allProducts.length})</CardTitle>
                      <CardDescription>View and moderate merchant products</CardDescription>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        className="pl-9 w-64"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Base Product</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Store</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allProducts.slice(0, 10).map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.mockupUrl && (
                                <img src={product.mockupUrl} alt={product.name} className="h-10 w-10 rounded object-cover" />
                              )}
                              <span className="font-medium">{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{product.baseProduct}</TableCell>
                          <TableCell>${product.price}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {allStores.find(s => s.userId === product.userId)?.storeName || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                              Published
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <XCircle className="h-4 w-4" />
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
                    <p className="text-2xl font-bold mt-1">{allOrders.filter(o => o.status === 'on-hold').length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">In Production</p>
                    <p className="text-2xl font-bold mt-1">{allOrders.filter(o => o.status === 'in-production').length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Shipped</p>
                    <p className="text-2xl font-bold mt-1">{allOrders.filter(o => o.status === 'shipped').length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Delivered</p>
                    <p className="text-2xl font-bold mt-1">{allOrders.filter(o => o.status === 'delivered').length}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Orders</CardTitle>
                      <CardDescription>Latest platform-wide orders</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Select defaultValue="all">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="production">In Production</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
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
                      {allOrders.slice(0, 10).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                          <TableCell>{order.customerEmail}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {allStores.find(s => s.id === order.storeId)?.storeName || 'Direct'}
                            </Badge>
                          </TableCell>
                          <TableCell>{order.items.length}</TableCell>
                          <TableCell>${order.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={
                                order.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                                order.status === 'shipped' ? 'bg-blue-500/10 text-blue-500' :
                                order.status === 'in-production' ? 'bg-yellow-500/10 text-yellow-500' :
                                'bg-muted text-muted-foreground'
                              }
                            >
                              {order.status}
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
                        ${(totalRevenue / (allOrders.length || 1)).toFixed(2)}
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
                      <Input className="w-24" defaultValue="$0.30" />
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
                      <Input className="w-24" defaultValue="$5.99" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">International Shipping</p>
                        <p className="text-sm text-muted-foreground">Base rate for international orders</p>
                      </div>
                      <Input className="w-24" defaultValue="$12.99" />
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
