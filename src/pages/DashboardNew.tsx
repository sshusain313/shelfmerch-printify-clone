import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
// import { CloudUpgradePrompt } from '@/components/CloudUpgradePrompt';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Store,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Plus,
  ExternalLink,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

const DashboardNew = () => {
  const { user, logout, isAdmin } = useAuth();
  const { products, orders, store, stats } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500/10 text-green-600 border-green-200';
      case 'shipped':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'in-production':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
      case 'on-hold':
        return 'bg-orange-500/10 text-orange-600 border-orange-200';
      case 'canceled':
        return 'bg-red-500/10 text-red-600 border-red-200';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const statCards = [
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingBag,
      color: 'text-primary',
    },
    {
      label: 'Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'text-blue-500',
    },
    {
      label: 'Revenue',
      value: `₹${stats.totalRevenue}`,
      icon: DollarSign,
      color: 'text-green-500',
    },
    {
      label: 'Profit',
      value: `₹${stats.totalProfit}`,
      icon: TrendingUp,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card p-6 z-50">
        <Link to="/" className="flex items-center space-x-2 mb-8">
          <span className="font-heading text-xl font-bold text-foreground">
            Shelf<span className="text-primary">Merch</span>
          </span>
        </Link>

        <nav className="space-y-2">
          <Button variant="secondary" className="w-full justify-start">
            <Package className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link to="/stores">
              <Store className="mr-2 h-4 w-4" />
              Manage Stores
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
            <p className="text-sm font-medium truncate">{user?.email}</p>
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
                Manage your products, orders, and store from one place.
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
          {/* <div className="mb-8">
            <CloudUpgradePrompt />
          </div> */}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="store">Store</TabsTrigger>
            </TabsList> */}

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
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

              {/* Recent Activity */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {orders.length > 0 ? (
                    orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                          <span className="font-semibold">₹{order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No orders yet. Start promoting your store!
                    </p>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => {
                    const mockup = product.mockupUrls?.[0] || product.mockupUrl;
                    return (
                      <Card key={product.id} className="overflow-hidden group">
                      <div className="aspect-square bg-muted relative">
                        {mockup ? (
                          <img
                            src={mockup}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="h-16 w-16" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="sm" variant="secondary">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="secondary">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">
                            ₹{product.price.toFixed(2)}
                          </span>
                          {product.compareAtPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              ₹{product.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created {new Date(product.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Card>
                  );
                  })}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-bold mb-2">No products yet</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start by creating your first product. Choose from our catalog and customize it
                    with your designs.
                  </p>
                  <Link to="/products">
                    <Button size="lg">Browse Product Catalog</Button>
                  </Link>
                </Card>
              )}
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              {orders.length > 0 ? (
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Order ID</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Items</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium">
                              #{order.id.slice(0, 8)}
                            </td>
                            <td className="px-6 py-4 text-sm">{order.customerEmail}</td>
                            <td className="px-6 py-4 text-sm">{order.items.length} items</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusLabel(order.status)}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold">
                              ₹{order.total.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Orders will appear here once customers start purchasing from your store.
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* Store Tab */}
            <TabsContent value="store" className="space-y-6">
              {store ? (
                <div className="space-y-6">
                  <Card className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{store.storeName}</h2>
                        <p className="text-muted-foreground flex items-center gap-2">
                          <span className="font-mono">{store.subdomain}.shelfmerch.com</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild>
                          <Link to={`/store/${store.subdomain}`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit Store
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link to={`/stores/${user?.id}/builder`}>
                            Visual Builder
                          </Link>
                        </Button>
                        <Button variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-sm text-muted-foreground">Theme</Label>
                        <p className="text-lg font-semibold capitalize">{store.theme}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Products</Label>
                        <p className="text-lg font-semibold">{products.length}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Created</Label>
                        <p className="text-lg font-semibold">
                          {new Date(store.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4">Store Performance</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-primary">{stats.totalOrders}</p>
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue}</p>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                        <p className="text-sm text-muted-foreground">Pending</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {stats.completedOrders}
                        </p>
                        <p className="text-sm text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h2 className="text-2xl font-bold mb-2">No store created yet</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your first ShelfMerch store to start selling your custom products online.
                  </p>
                  <Link to="/create-store">
                    <Button size="lg">
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your Store
                    </Button>
                  </Link>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DashboardNew;
