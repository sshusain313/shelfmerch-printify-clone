import React, { useEffect, useState, useMemo } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { storeOrdersApi } from '@/lib/api';
import { Order } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';

const Orders = () => {
  const { selectedStore } = useStore();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [amountSort, setAmountSort] = useState<string>('none');
  const [alphabeticalSort, setAlphabeticalSort] = useState<string>('none');

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

        setAllOrders(filtered);
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

  // Generate month and year options
  const monthOptions = [
    { value: 'all', label: 'All Months' },
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  // Generate year options (current year and past 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: 'all', label: 'All Years' },
    ...Array.from({ length: 6 }, (_, i) => ({
      value: String(currentYear - i),
      label: String(currentYear - i),
    })),
  ];

  // Filter and sort orders based on all criteria
  const orders = useMemo(() => {
    let filtered = [...allOrders];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        // Search by customer email
        const emailMatch = order.customerEmail?.toLowerCase().includes(query);
        
        // Search by product name (from order items)
        const productMatch = order.items?.some((item: any) => {
          const productName = item.productName || '';
          return productName.toLowerCase().includes(query);
        });

        return emailMatch || productMatch;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply date filter (month and year)
    if (selectedMonth !== 'all' || selectedYear !== 'all') {
      filtered = filtered.filter((order) => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt);
        
        if (selectedMonth !== 'all') {
          const monthMatch = orderDate.getMonth() === parseInt(selectedMonth);
          if (!monthMatch) return false;
        }
        
        if (selectedYear !== 'all') {
          const yearMatch = orderDate.getFullYear() === parseInt(selectedYear);
          if (!yearMatch) return false;
        }
        
        return true;
      });
    }

    // Apply amount sorting
    if (amountSort !== 'none') {
      filtered.sort((a, b) => {
        const amountA = a.total !== undefined ? a.total : 0;
        const amountB = b.total !== undefined ? b.total : 0;
        
        if (amountSort === 'low-high') {
          return amountA - amountB;
        } else if (amountSort === 'high-low') {
          return amountB - amountA;
        }
        return 0;
      });
    }

    // Apply alphabetical sorting
    if (alphabeticalSort !== 'none') {
      filtered.sort((a, b) => {
        let compareA = '';
        let compareB = '';

        if (alphabeticalSort === 'product-az' || alphabeticalSort === 'product-za') {
          // Sort by product name
          const productA = a.items && a.items.length > 0 
            ? (a.items[0].productName || '')
            : '';
          const productB = b.items && b.items.length > 0
            ? (b.items[0].productName || '')
            : '';
          compareA = productA.toLowerCase();
          compareB = productB.toLowerCase();
        } else if (alphabeticalSort === 'email-az' || alphabeticalSort === 'email-za') {
          // Sort by customer email
          compareA = (a.customerEmail || '').toLowerCase();
          compareB = (b.customerEmail || '').toLowerCase();
        }

        const comparison = compareA.localeCompare(compareB);
        
        if (alphabeticalSort === 'product-za' || alphabeticalSort === 'email-za') {
          return -comparison; // Reverse for Z-A
        }
        return comparison; // A-Z
      });
    }

    return filtered;
  }, [allOrders, searchQuery, statusFilter, selectedMonth, selectedYear, amountSort, alphabeticalSort]);

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

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-production">In Production</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="on-hold">On-hold</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem> 
                </SelectContent>
              </Select>

              {/* Month Filter */}
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Year Filter */}
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Amount Sort */}
              <Select value={amountSort} onValueChange={setAmountSort}>
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
              <Select value={alphabeticalSort} onValueChange={setAlphabeticalSort}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort Alphabetically" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="product-az">Product (A → Z)</SelectItem>
                  <SelectItem value="product-za">Product (Z → A)</SelectItem>
                  <SelectItem value="email-az">Email (A → Z)</SelectItem>
                  <SelectItem value="email-za">Email (Z → A)</SelectItem>
                </SelectContent>
              </Select>
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
                      <tr key={(order as any)._id || order.id || `order-${Math.random()}`} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium">#{(order as any)._id || order.id || 'N/A'}</td>
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
                          {order.total !== undefined ? `₹${order.total.toFixed(2)}` : '-'}
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
