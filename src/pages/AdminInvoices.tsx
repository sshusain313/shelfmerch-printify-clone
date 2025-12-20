import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    FileText,
    Search,
    CheckCircle2,
    Clock,
    ArrowLeft,
    Filter,
    Users,
    Store,
    ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { invoiceApi } from '@/lib/api';
import { toast } from 'sonner';

const AdminInvoices = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const loadInvoices = async () => {
            try {
                setIsLoading(true);
                const resp = await invoiceApi.listAll();
                if (resp.success) {
                    setInvoices(resp.data);
                } else {
                    setError(resp.message || 'Failed to load invoices');
                }
            } catch (err: any) {
                setError(err?.message || 'Failed to load invoices');
            } finally {
                setIsLoading(false);
            }
        };

        loadInvoices();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-500/10 text-green-500';
            case 'pending': return 'bg-yellow-500/10 text-yellow-500';
            case 'cancelled': return 'bg-red-500/10 text-red-500';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.merchantId?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.storeId?.storeName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link to="/admin" className="text-sm text-primary hover:underline flex items-center gap-1 mb-2">
                            <ArrowLeft className="h-3 w-3" /> Back to Admin
                        </Link>
                        <h1 className="text-3xl font-bold">System Invoices</h1>
                        <p className="text-muted-foreground mt-1">
                            Monitor and manage all fulfillment invoices across the platform
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" /> Export All
                        </Button>
                    </div>
                </div>

                {/* Search & Filters */}
                <Card className="p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by invoice #, merchant email, or store..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline">
                            <Filter className="h-4 w-4 mr-2" /> Filter Invoices
                        </Button>
                    </div>
                </Card>

                {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

                {isLoading ? (
                    <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading all invoices...</p>
                ) : filteredInvoices.length === 0 ? (
                    <Card className="p-12 text-center border-dashed">
                        <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-lg font-medium">No invoices found.</p>
                    </Card>
                ) : (
                    <Card className="overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Invoice</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Merchant</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Store/Order</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Amount</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredInvoices.map((inv) => (
                                        <tr key={inv._id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold">{inv.invoiceNumber}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{inv.merchantId?.name || 'User'}</span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Users className="h-3 w-3" /> {inv.merchantId?.email}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium flex items-center gap-1">
                                                        <Store className="h-3 w-3 text-muted-foreground" /> {inv.storeId?.storeName || 'Store'}
                                                    </span>
                                                    <Link to={`/admin/orders/${inv.orderId?._id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                                                        Order #{inv.orderId?.orderNumber || inv.orderId?._id?.slice(-6)}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={`capitalize ${getStatusColor(inv.status)}`}>
                                                    {inv.status === 'paid' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                                    {inv.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold">₹{inv.totalAmount?.toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-muted-foreground italic">
                                                {new Date(inv.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default AdminInvoices;
