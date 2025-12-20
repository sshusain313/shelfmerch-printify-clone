import React, { useEffect, useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { storeOrdersApi } from '@/lib/api';
import { Order } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';

const Orders = () => {
  const { selectedStore } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        setIsLoading(true);
        const data = await storeOrdersApi.listForMerchant();

        if (!isMounted) return;

        let filtered: Order[] = data || [];

        if (selectedStore) {
          const storeId = selectedStore.id || selectedStore._id;
          filtered = filtered.filter((order: any) => {
            const orderStoreId = order.storeId?._id?.toString() || order.storeId?.toString() || order.storeId;
            return (
              orderStoreId === storeId ||
              orderStoreId === selectedStore._id ||
              orderStoreId === selectedStore.id
            );
          });
        }

        setOrders(filtered);
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load orders');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [selectedStore]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-500';
      case 'fulfilled': return 'bg-blue-500/10 text-blue-500';
      case 'on-hold': return 'bg-yellow-500/10 text-yellow-500';
      case 'cancelled': return 'bg-red-500/10 text-red-500';
      case 'refunded': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
  
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage all your customer orders
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Orders Table */}
          {error && (
            <p className="mb-4 text-sm text-destructive">{error}</p>
          )}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders found yet.</p>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Order ID</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Product</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Customer</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map((order) => (
                      <tr key={order._id || order.id || `order-${Math.random()}`} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium">#{order._id || order.id || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">
                          {order.items && order.items.length > 0
                            ? order.items[0].productName || `${order.items.length} items`
                            : 'No items'}
                        </td>
                        <td className="px-6 py-4 text-sm">{order.customerEmail}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold">
                          {order.total !== undefined ? `$${order.total.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
      </div>
    </DashboardLayout>
  );
};

export default Orders;
