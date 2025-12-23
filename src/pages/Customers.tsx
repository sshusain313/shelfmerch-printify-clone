import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { storeCustomersApi, storeOrdersApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
interface StoreCustomerRow {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
  lastSeenAt?: string;
  orderCount: number;
  totalSpent: number;
}

const Customers: React.FC = () => {
  const { selectedStore } = useStore();
  const [customers, setCustomers] = useState<StoreCustomerRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'email' | 'orderCount' | 'totalSpent'>('orderCount');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const load = async () => {
      if (!selectedStore) {
        setCustomers([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const storeId = (selectedStore as any).id || (selectedStore as any)._id;

        // Try to fetch customers from API first
        try {
          const resp = await storeCustomersApi.listByStore(storeId);
          const data = (resp as any)?.data || resp || [];
          if (data && Array.isArray(data) && data.length > 0) {
            setCustomers(data as StoreCustomerRow[]);
            setIsLoading(false);
            return;
          }
        } catch (apiError: any) {
          // If API endpoint doesn't exist (404), fall back to deriving from orders
          if (apiError.status === 404) {
            console.log('Customers API endpoint not available, deriving from orders...');
          } else {
            throw apiError; // Re-throw other errors
          }
        }

        // Fallback: Derive customers from orders
        const orders = await storeOrdersApi.listForMerchant();
        const storeOrders = (orders || []).filter((order: any) => {
          const orderStoreId = order.storeId?._id?.toString() || order.storeId?.toString() || order.storeId;
          return orderStoreId === storeId || orderStoreId === selectedStore._id || orderStoreId === selectedStore.id;
        });

        // Aggregate customer data from orders
        const customerMap = new Map<string, StoreCustomerRow>();

        storeOrders.forEach((order: any) => {
          const email = order.customerEmail || order.shippingAddress?.email || '';
          const name = order.shippingAddress?.fullName || order.customerName || '';
          if (!email) return;

          const customerId = email.toLowerCase();
          const existing = customerMap.get(customerId);

          if (existing) {
            existing.orderCount += 1;
            existing.totalSpent += order.total || 0;
            // Update last seen date if this order is more recent
            if (order.createdAt && (!existing.lastSeenAt || new Date(order.createdAt) > new Date(existing.lastSeenAt))) {
              existing.lastSeenAt = order.createdAt;
            }
            // Update first seen date if this order is older
            if (order.createdAt && (!existing.createdAt || new Date(order.createdAt) < new Date(existing.createdAt))) {
              existing.createdAt = order.createdAt;
            }
          } else {
            customerMap.set(customerId, {
              id: customerId,
              email: email,
              name: name,
              createdAt: order.createdAt,
              lastSeenAt: order.createdAt,
              orderCount: 1,
              totalSpent: order.total || 0,
            });
          }
        });

        setCustomers(Array.from(customerMap.values()));
      } catch (e: any) {
        console.error('Failed to load customers:', e);
        setError(e?.message || 'Failed to load customers');
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [selectedStore]);

  const filteredCustomers = useMemo(() => {
    let list = customers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.name && c.name.toLowerCase().includes(q))
      );
    }

    list = [...list].sort((a, b) => {
      let aVal: any;
      let bVal: any;
      switch (sortKey) {
        case 'name':
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          break;
        case 'email':
          aVal = (a.email || '').toLowerCase();
          bVal = (b.email || '').toLowerCase();
          break;
        case 'orderCount':
          aVal = a.orderCount || 0;
          bVal = b.orderCount || 0;
          break;
        case 'totalSpent':
          aVal = a.totalSpent || 0;
          bVal = b.totalSpent || 0;
          break;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [customers, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const pagedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, page]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground mt-1">
              {selectedStore
                ? `Customers who have purchased from ${selectedStore.storeName}.`
                : 'Select a store on the dashboard to view its customers.'}
            </p>
          </div>

          {selectedStore && (
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers by email or name..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                />
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <span>Sort by:</span>
                <Button
                  type="button"
                  variant={sortKey === 'orderCount' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setSortKey('orderCount')}
                >
                  Orders
                </Button>
                <Button
                  type="button"
                  variant={sortKey === 'totalSpent' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setSortKey('totalSpent')}
                >
                  Total Spent
                </Button>
                <Button
                  type="button"
                  variant={sortKey === 'name' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setSortKey('name')}
                >
                  Name
                </Button>
                <Button
                  type="button"
                  variant={sortDir === 'desc' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
                >
                  {sortDir === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <p className="mb-4 text-sm text-destructive">{error}</p>
          )}

          {!selectedStore ? (
            <Card className="p-8 text-sm text-muted-foreground">
              Select a store to see customer data.
            </Card>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Loading customers...</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customers found for this store.</p>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Customer</th>
                      <th className="px-6 py-3 text-left font-semibold">Orders</th>
                      <th className="px-6 py-3 text-left font-semibold">Total Spent</th>
                      <th className="px-6 py-3 text-left font-semibold hidden md:table-cell">First Seen</th>
                      <th className="px-6 py-3 text-left font-semibold hidden md:table-cell">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pagedCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3 align-middle">
                          <div className="flex flex-col">
                            <span className="font-medium">{c.name || '—'}</span>
                            <span className="text-xs text-muted-foreground">{c.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 align-middle">
                          <Badge variant="outline">{c.orderCount}</Badge>
                        </td>
                        <td className="px-6 py-3 align-middle font-medium">
                          ${c.totalSpent?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-3 align-middle text-xs text-muted-foreground hidden md:table-cell">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-3 align-middle text-xs text-muted-foreground hidden md:table-cell">
                          {c.lastSeenAt ? new Date(c.lastSeenAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                <span>
                  Page {page} of {totalPages} · {filteredCustomers.length} customer
                  {filteredCustomers.length === 1 ? '' : 's'}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          )}
      </div>
    </DashboardLayout>
  );
};

export default Customers;
