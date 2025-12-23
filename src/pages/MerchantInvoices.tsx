import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    CreditCard,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileText,
    Wallet,
    History
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { invoiceApi, walletApi } from '@/lib/api';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';

declare global {
    interface Window {
        Razorpay: any;
    }
}

const MerchantInvoices = () => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [walletBalance, setWalletBalance] = useState<{ balancePaise: number; balanceRupees: string } | null>(null);
    const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);

            // Load invoices and wallet balance in parallel
            const [invoicesData, balanceData] = await Promise.all([
                invoiceApi.listForMerchant(),
                walletApi.getBalance()
            ]);

            setInvoices(invoicesData || []);
            setWalletBalance(balanceData);
        } catch (err: any) {
            setError(err?.message || 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayWithWallet = async (invoiceId: string) => {
        try {
            setPayingInvoiceId(invoiceId);

            const response = await invoiceApi.payWithWallet(invoiceId, true);

            if (response.status === 'paid') {
                // Fully paid with wallet
                toast.success(`Invoice paid successfully! ₹${response.walletDebitedRupees} debited from wallet.`);

                // Update invoice in list
                setInvoices(prev => prev.map(inv =>
                    inv._id === invoiceId ? { ...inv, status: 'paid', paidAt: new Date() } : inv
                ));

                // Refresh wallet balance
                const newBalance = await walletApi.getBalance();
                setWalletBalance(newBalance);
            } else if (response.status === 'pending_razorpay') {
                // Need to complete with Razorpay
                toast.info(`₹${response.walletDebitedRupees} applied from wallet. Complete remaining ₹${response.remainingRupees} payment.`);

                // Open Razorpay checkout for remainder
                openRazorpayCheckout(
                    response.razorpayOrderId!,
                    response.razorpayKeyId!,
                    response.razorpayAmount!,
                    response.razorpayCurrency!,
                    invoiceId
                );

                // Refresh wallet balance (wallet already debited)
                const newBalance = await walletApi.getBalance();
                setWalletBalance(newBalance);
            }
        } catch (err: any) {
            toast.error(err?.message || 'Payment failed');
        } finally {
            setPayingInvoiceId(null);
        }
    };

    const openRazorpayCheckout = (
        orderId: string,
        keyId: string,
        amount: number,
        currency: string,
        invoiceId: string
    ) => {
        const options = {
            key: keyId,
            amount: amount,
            currency: currency,
            name: 'ShelfMerch',
            description: 'Fulfillment Invoice Payment',
            order_id: orderId,
            handler: function (response: any) {
                // Payment completed - webhook will mark invoice as paid
                toast.success('Payment successful! Invoice will be marked as paid shortly.');
                // Reload data after a short delay to let webhook process
                setTimeout(() => loadData(), 2000);
            },
            prefill: {},
            theme: {
                color: '#6366f1'
            },
            modal: {
                ondismiss: function () {
                    toast.info('Payment cancelled. You can try again later.');
                }
            }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-500/10 text-green-500';
            case 'pending': return 'bg-yellow-500/10 text-yellow-500';
            case 'cancelled': return 'bg-red-500/10 text-red-500';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Wallet & Invoices</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your fulfillment costs and invoices
                        </p>
                    </div>
                    <Card className="p-4 bg-primary/5 border-primary/20">
                        <div className="flex items-center gap-3">
                            <Wallet className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Wallet Balance</p>
                                <p className="text-xl font-bold">
                                    ₹{walletBalance ? walletBalance.balanceRupees : '0.00'}
                                </p>
                            </div>
                            <div className="flex gap-2 ml-4">
                                <Button size="sm" asChild>
                                    <Link to="/wallet/top-up">Top Up</Link>
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                    <Link to="/wallet/transactions">
                                        <History className="h-3 w-3 mr-1" />
                                        History
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

                {isLoading ? (
                    <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading invoices...</p>
                ) : invoices.length === 0 ? (
                    <Card className="p-12 text-center border-dashed">
                        <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-lg font-medium">No invoices yet.</p>
                        <p className="text-muted-foreground">Your fulfillment invoices will appear here once you receive orders.</p>
                    </Card>
                ) : (
                    <Card className="overflow-hidden border-shadow">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">Invoice</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">Store/Order</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Amount</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {invoices.map((inv) => (
                                        <tr key={inv._id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-foreground">{inv.invoiceNumber}</span>
                                                    <span className="text-xs text-muted-foreground">Fulfillment</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{inv.storeId?.storeName || 'Store'}</span>
                                                    <Link to="/orders" className="text-xs text-primary hover:underline flex items-center gap-1">
                                                        Order #{inv.orderId?.orderNumber || inv.orderId?._id?.slice(-6)}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground italic">
                                                {new Date(inv.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={`capitalize ${getStatusColor(inv.status)}`}>
                                                    {inv.status === 'paid' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                                    {inv.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-foreground">₹{inv.totalAmount?.toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {inv.status === 'pending' ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handlePayWithWallet(inv._id)}
                                                        className="font-semibold shadow-sm"
                                                        disabled={payingInvoiceId === inv._id}
                                                    >
                                                        {payingInvoiceId === inv._id ? (
                                                            'Processing...'
                                                        ) : (
                                                            <>
                                                                <CreditCard className="h-3 w-3 mr-1" />
                                                                Pay Now
                                                            </>
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button variant="outline" size="sm" className="font-medium">
                                                        Download PDF
                                                    </Button>
                                                )}
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

export default MerchantInvoices;