import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import { toast } from 'sonner';

interface StoreCustomerProfile {
  id: string;
  name?: string;
  email?: string;
  marketingOptIn?: boolean;
}

interface StoreOrderItem {
  productName?: string;
  quantity?: number;
}

interface StoreOrderSummary {
  _id: string;
  createdAt?: string;
  status: string;
  total?: number;
  items?: StoreOrderItem[];
}

const StoreCustomerAccountPage: React.FC = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const { customer, isAuthenticated } = useStoreAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'profile' | 'security'>('overview');
  const [profile, setProfile] = useState<StoreCustomerProfile | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [orders, setOrders] = useState<StoreOrderSummary[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const getToken = () => {
    if (!subdomain) return null;
    return localStorage.getItem(`store_token_${subdomain}`);
  };

  // Load full profile (including marketingOptIn) and orders
  useEffect(() => {
    if (!subdomain) return;

    const token = getToken();
    if (!token) return;

    const loadProfile = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/store-auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await resp.json();
        if (resp.ok && data.success && data.customer) {
          setProfile({
            id: data.customer._id || data.customer.id,
            name: data.customer.name,
            email: data.customer.email,
            marketingOptIn: data.customer.marketingOptIn,
          });
        }
      } catch (err) {
        console.error('Failed to load customer profile', err);
      }
    };

    const loadOrders = async () => {
      try {
        setOrdersLoading(true);
        setOrdersError(null);
        const resp = await fetch(`${API_BASE}/api/store-customer/orders`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
          setOrders(data.data || []);
        } else {
          setOrdersError(data.message || 'Failed to load orders');
        }
      } catch (err: any) {
        console.error('Failed to load customer orders', err);
        setOrdersError(err?.message || 'Failed to load orders');
      } finally {
        setOrdersLoading(false);
      }
    };

    loadProfile();
    loadOrders();
  }, [subdomain]);

  if (!subdomain) {
    return <div className="min-h-screen flex items-center justify-center">Store not found</div>;
  }

  if (!isAuthenticated || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              You need to sign in to view your account and orders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link to={`/store/${subdomain}/auth?redirect=account`}>
                Go to Sign In
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to={`/store/${subdomain}`}>Return to Store</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain || !profile) return;
    const token = getToken();
    if (!token) return;

    try {
      setProfileSaving(true);
      const resp = await fetch(`${API_BASE}/api/store-auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          marketingOptIn: profile.marketingOptIn,
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.success && data.customer) {
        setProfile({
          id: data.customer._id || data.customer.id,
          name: data.customer.name,
          email: data.customer.email,
          marketingOptIn: data.customer.marketingOptIn,
        });
        toast.success('Profile updated');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Failed to update profile', err);
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain) return;
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error('New password and confirmation must match');
      return;
    }
    const token = getToken();
    if (!token) return;

    try {
      setChangingPassword(true);
      const resp = await fetch(`${API_BASE}/api/store-auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        toast.success('Password updated');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (err: any) {
      console.error('Failed to change password', err);
      toast.error(err?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const primaryName = profile?.name || customer.name || 'Your account';
  const email = profile?.email || customer.email;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl space-y-6 mt-8 mb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Account</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your profile, orders, and security settings for this store.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end text-sm">
            <span className="font-medium">{primaryName}</span>
            {email && <span className="text-muted-foreground">{email}</span>}
            <Badge variant="outline" className="mt-2 text-xs">
              Store customer
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
                <CardDescription>
                  Quick overview of your account for this store.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Name</p>
                  <p className="font-medium">{primaryName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="font-medium break-all">{email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Marketing</p>
                  <p className="font-medium">
                    {profile?.marketingOptIn ? 'Subscribed' : 'Not subscribed'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Last few orders for this store.</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet.</p>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <div
                        key={order._id}
                        className="flex items-center justify-between text-sm border rounded-md px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">Order #{order._id.slice(-6)}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString()
                              : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="mb-1 text-xs">{order.status}</Badge>
                          <p className="font-semibold">
                            {typeof order.total === 'number'
                              ? `₹${order.total.toFixed(2)}`
                              : '-'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {orders.length > 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveTab('orders')}
                      >
                        View all orders
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Orders</CardTitle>
                <CardDescription>Orders you have placed in this store.</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersError && (
                  <p className="text-sm text-destructive mb-3">{ordersError}</p>
                )}
                {ordersLoading ? (
                  <p className="text-sm text-muted-foreground">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2">Order</th>
                          <th className="text-left px-3 py-2">Date</th>
                          <th className="text-left px-3 py-2">Status</th>
                          <th className="text-right px-3 py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {orders.map((order) => (
                          <tr key={order._id} className="hover:bg-muted/30">
                            <td className="px-3 py-2 font-medium">
                              #{order._id.slice(-8)}
                            </td>
                            <td className="px-3 py-2">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleString()
                                : ''}
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="secondary">{order.status}</Badge>
                            </td>
                            <td className="px-3 py-2 text-right font-semibold">
                              {typeof order.total === 'number'
                                ? `₹${order.total.toFixed(2)}`
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal details.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleProfileSave}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      value={profile?.name || ''}
                      onChange={(e) =>
                        setProfile((prev) =>
                          prev ? { ...prev, name: e.target.value } : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={email || ''} disabled />
                  </div>
                  <div className="flex items-center justify-between border rounded-md px-3 py-2">
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm">Marketing emails</p>
                      <p className="text-xs text-muted-foreground">
                        Receive updates and promotions from this store.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setProfile((prev) =>
                          prev
                            ? { ...prev, marketingOptIn: !prev.marketingOptIn }
                            : prev
                        )
                      }
                    >
                      {profile?.marketingOptIn ? 'Subscribed' : 'Subscribe'}
                    </Button>
                  </div>
                  <Button type="submit" disabled={profileSaving}>
                    {profileSaving ? 'Saving...' : 'Save changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Update your password for this store account.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleChangePassword}>
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword ? 'Updating...' : 'Change password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StoreCustomerAccountPage;
