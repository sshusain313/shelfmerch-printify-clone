import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from 'lucide-react';

const Admin = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: 'Total Merchants', value: '1,234', change: '+12%', icon: Users },
    { label: 'Total Products', value: '5,678', change: '+8%', icon: Package },
    { label: 'Active Stores', value: '987', change: '+15%', icon: Store },
    { label: 'Platform Revenue', value: '$45,678', change: '+23%', icon: DollarSign },
  ];

  const recentOrders = [
    { id: 'ORD-001', merchant: 'John\'s Store', product: 'Custom T-Shirt', status: 'Processing', amount: '$24.99' },
    { id: 'ORD-002', merchant: 'Jane\'s Shop', product: 'Hoodie', status: 'Shipped', amount: '$49.99' },
    { id: 'ORD-003', merchant: 'Mike\'s Brand', product: 'Tote Bag', status: 'Delivered', amount: '$15.99' },
  ];

  const merchants = [
    { id: '1', name: 'John Doe', email: 'john@example.com', stores: 2, products: 15, revenue: '$1,234' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', stores: 1, products: 8, revenue: '$892' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', stores: 3, products: 24, revenue: '$2,145' },
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

        <div className="mb-6 p-3 bg-primary/10 rounded-lg">
          <p className="text-xs font-semibold text-primary">ADMIN PANEL</p>
        </div>

        <nav className="space-y-2">
          <Button variant="secondary" className="w-full justify-start">
            <TrendingUp className="mr-2 h-4 w-4" />
            Overview
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" />
            Merchants
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Package className="mr-2 h-4 w-4" />
            Products
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Orders
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Store className="mr-2 h-4 w-4" />
            Providers
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="border-t pt-4 space-y-2">
            <p className="text-sm text-muted-foreground">Admin</p>
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
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Platform overview and management
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium text-green-500">{stat.change}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList>
              <TabsTrigger value="orders">Recent Orders</TabsTrigger>
              <TabsTrigger value="merchants">Merchants</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <Card>
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Recent Orders</h2>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search orders..."
                          className="pl-9 w-64"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Merchant</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.merchant}</TableCell>
                        <TableCell>{order.product}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{order.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="merchants">
              <Card>
                <div className="p-6 border-b">
                  <h2 className="text-xl font-bold">Merchant Management</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Stores</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {merchants.map((merchant) => (
                      <TableRow key={merchant.id}>
                        <TableCell className="font-medium">{merchant.name}</TableCell>
                        <TableCell>{merchant.email}</TableCell>
                        <TableCell>{merchant.stores}</TableCell>
                        <TableCell>{merchant.products}</TableCell>
                        <TableCell className="text-right">{merchant.revenue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold mb-2">Product Management</h2>
                <p className="text-muted-foreground">
                  Catalog management interface coming soon
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Admin;
