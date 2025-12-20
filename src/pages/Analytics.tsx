import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { Card } from '@/components/ui/card';
import { storeOrdersApi } from '@/lib/api';
import { Order } from '@/types';
import {
    DollarSign,
    Eye,
    Package,
    ShoppingBag,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

const Analytics = () => {
    const { selectedStore } = useStore();

    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadOrders = async () => {
            if (!selectedStore) {
                setOrders([]);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                const resp = await storeOrdersApi.listForMerchant();
                const data = (resp as any)?.data || resp || [];

                const storeId = (selectedStore as any).id || (selectedStore as any)._id;

                const filtered = (data as any[]).filter((order: any) => {
                    const orderStoreId = order.storeId?._id?.toString() || order.storeId?._id || order.storeId?.toString() || order.storeId;
                    return (
                        orderStoreId === storeId ||
                        orderStoreId === (selectedStore as any)._id ||
                        orderStoreId === (selectedStore as any).id
                    );
                });

                setOrders(filtered as Order[]);
            } catch (e: any) {
                setError(e?.message || 'Failed to load analytics data');
            } finally {
                setIsLoading(false);
            }
        };

        loadOrders();
    }, [selectedStore]);

    const totalRevenue = useMemo(
        () => orders.reduce((sum, o: any) => sum + (o.total || 0), 0),
        [orders]
    );

    const totalOrders = orders.length;

    const totalProductsSold = useMemo(
        () =>
            orders.reduce((sum, o: any) => {
                const items = o.items || [];
                const qty = items.reduce(
                    (inner: number, item: any) => inner + (item.quantity || 0),
                    0
                );
                return sum + qty;
            }, 0),
        [orders]
    );

    const stats = [
        {
            label: 'Total Revenue',
            value: `$${totalRevenue.toFixed(2)}`,
            change: '+0%',
            icon: DollarSign,
        },
        {
            label: 'Orders',
            value: String(totalOrders),
            change: '+0%',
            icon: ShoppingBag,
        },
        {
            label: 'Products Sold',
            value: String(totalProductsSold),
            change: '+0%',
            icon: Package,
        },
        { label: 'Store Views', value: '0', change: '+0%', icon: Eye },
    ];

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Analytics</h1>
                        <p className="text-muted-foreground mt-1">
                            {selectedStore
                                ? `Performance and insights for ${selectedStore.storeName}.`
                                : 'Select a store on the dashboard to see analytics.'}
                        </p>
                    </div>

                    {error && (
                        <p className="mb-4 text-sm text-destructive">{error}</p>
                    )}

                    {/* Stats Grid */}
                    {selectedStore && !isLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {stats.map((stat) => (
                                <Card key={stat.label} className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <stat.icon className="h-8 w-8 text-primary" />
                                        <span className="text-sm font-medium text-green-500">{stat.change}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                                    <p className="text-3xl font-bold">{stat.value}</p>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Charts Placeholder */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                Chart coming soon
                            </div>
                        </Card>
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Top Products</h3>
                            <div className="h-64 flex items-center justify-center text-muted-foreground">
                                Chart coming soon
                            </div>
                        </Card>
                    </div>
            </div>
        </DashboardLayout>
    );
};

export default Analytics;
