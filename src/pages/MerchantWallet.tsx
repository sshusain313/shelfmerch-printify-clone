import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    CheckCircle2,
    Clock,
    XCircle,
    FileText,
    Wallet,
    History,
    ArrowDownToLine,
    AlertCircle,
    RefreshCw,
    ExternalLink,
    Banknote,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { invoiceApi, withdrawalApi, walletApi } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import WithdrawalRequestDialog from '@/components/wallet/WithdrawalRequestDialog';
import { toast } from 'sonner';

interface WalletSummary {
    balancePaise: number;
    balanceRupees: string;
    currency: string;
    status: string;
    pendingWithdrawalsPaise: number;
    pendingWithdrawalsRupees: string;
    availableForWithdrawalPaise: number;
    availableForWithdrawalRupees: string;
}

interface WithdrawalRequest {
    id: string;
    amountPaise: number;
    amountRupees: string;
    currency: string;
    upiId: string;
    status: string;
    requestedAt: string;
    reviewedAt?: string;
    paidAt?: string;
    rejectionReason?: string;
    payoutMethod: string;
    payoutReference?: string;
}

interface Invoice {
    _id: string;
    invoiceNumber: string;
    storeId?: { storeName: string; subdomain: string };
    orderId?: { orderNumber: string; _id: string };
    status: string;
    totalAmount: number;
    createdAt: string;
    paymentDetails?: { shortfallPaise?: number };
}

const MerchantWallet = () => {
    const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('withdrawals');
    const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);

            const [summaryData, withdrawalsData, invoicesData] = await Promise.all([
                withdrawalApi.getWalletSummary(),
                withdrawalApi.list({ limit: 50 }),
                invoiceApi.listForMerchant(),
            ]);

            setWalletSummary(summaryData);
            setWithdrawals(withdrawalsData.data || []);
            setInvoices(invoicesData || []);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to load data';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const getWithdrawalStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                    </Badge>
                );
            case 'APPROVED':
                return (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Approved
                    </Badge>
                );
            case 'PAID':
                return (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">
                        <Banknote className="h-3 w-3 mr-1" />
                        Paid
                    </Badge>
                );
            case 'REJECTED':
                return (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600">
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejected
                    </Badge>
                );
            case 'FAILED':
                return (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failed
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getInvoiceStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Paid
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge variant="outline" className="bg-red-500/10 text-red-500">
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancelled
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Wallet & Payouts</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your wallet balance and withdrawal requests
                        </p>
                    </div>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Total Balance */}
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-full bg-primary/10">
                                    <Wallet className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                        Total Balance
                                    </p>
                                    <p className="text-2xl font-bold">
                                        ₹{walletSummary?.balanceRupees || '0.00'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pending Withdrawals */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-full bg-yellow-500/10">
                                    <Clock className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                        Pending Withdrawals
                                    </p>
                                    <p className="text-2xl font-bold">
                                        ₹{walletSummary?.pendingWithdrawalsRupees || '0.00'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Available for Withdrawal */}
                    <Card className="relative overflow-hidden">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-full bg-green-500/10">
                                        <ArrowDownToLine className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                            Available to Withdraw
                                        </p>
                                        <p className="text-2xl font-bold text-green-600">
                                            ₹{walletSummary?.availableForWithdrawalRupees || '0.00'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => setIsWithdrawalDialogOpen(true)}
                                    disabled={(walletSummary?.availableForWithdrawalPaise || 0) < 10000}
                                >
                                    Withdraw
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mb-6">
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/wallet/top-up">
                            <Wallet className="h-4 w-4 mr-2" />
                            Top Up Wallet
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link to="/wallet/transactions">
                            <History className="h-4 w-4 mr-2" />
                            Transaction History
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={loadData} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Tabs: Withdrawals / Invoices */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="withdrawals" className="gap-2">
                            <ArrowDownToLine className="h-4 w-4" />
                            Withdrawal Requests
                            {withdrawals.filter((w) => w.status === 'PENDING').length > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {withdrawals.filter((w) => w.status === 'PENDING').length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="invoices" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Fulfillment Invoices
                        </TabsTrigger>
                    </TabsList>

                    {/* Withdrawals Tab */}
                    <TabsContent value="withdrawals">
                        {isLoading ? (
                            <Card className="p-12 text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Loading withdrawal requests...</p>
                            </Card>
                        ) : withdrawals.length === 0 ? (
                            <Card className="p-12 text-center border-dashed">
                                <ArrowDownToLine className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-lg font-medium">No withdrawal requests yet</p>
                                <p className="text-muted-foreground mb-4">
                                    Request a withdrawal to receive funds in your bank account
                                </p>
                                <Button
                                    onClick={() => setIsWithdrawalDialogOpen(true)}
                                    disabled={(walletSummary?.availableForWithdrawalPaise || 0) < 10000}
                                >
                                    Request Withdrawal
                                </Button>
                            </Card>
                        ) : (
                            <Card className="overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    UPI ID
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Requested
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Reference
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {withdrawals.map((w) => (
                                                <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="text-lg font-bold">₹{w.amountRupees}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-sm">{w.upiId}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {getWithdrawalStatusBadge(w.status)}
                                                        {w.status === 'REJECTED' && w.rejectionReason && (
                                                            <p className="text-xs text-red-500 mt-1">
                                                                {w.rejectionReason}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                                        {new Date(w.requestedAt).toLocaleDateString(undefined, {
                                                            dateStyle: 'medium',
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {w.payoutReference ? (
                                                            <span className="font-mono text-sm text-green-600">
                                                                {w.payoutReference}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Invoices Tab */}
                    <TabsContent value="invoices">
                        {isLoading ? (
                            <Card className="p-12 text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Loading invoices...</p>
                            </Card>
                        ) : invoices.length === 0 ? (
                            <Card className="p-12 text-center border-dashed">
                                <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-lg font-medium">No invoices yet</p>
                                <p className="text-muted-foreground">
                                    Your fulfillment invoices will appear here once you receive orders.
                                </p>
                            </Card>
                        ) : (
                            <Card className="overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Invoice
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Store/Order
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {invoices.map((inv) => (
                                                <tr key={inv._id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold">{inv.invoiceNumber}</span>
                                                            <span className="text-xs text-muted-foreground">Fulfillment</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">
                                                                {inv.storeId?.storeName || 'Store'}
                                                            </span>
                                                            <Link
                                                                to="/orders"
                                                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                                            >
                                                                Order #{inv.orderId?.orderNumber || inv.orderId?._id?.slice(-6)}
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                                        {new Date(inv.createdAt).toLocaleDateString(undefined, {
                                                            dateStyle: 'medium',
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4">{getInvoiceStatusBadge(inv.status)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-bold">₹{inv.totalAmount?.toFixed(2)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {inv.status === 'paid' ? (
                                                            <Button variant="outline" size="sm">
                                                                Download PDF
                                                            </Button>
                                                        ) : (
                                                            <Button variant="outline" size="sm" disabled>
                                                                Processing...
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
                    </TabsContent>
                </Tabs>

                {/* Withdrawal Request Dialog */}
                <WithdrawalRequestDialog
                    open={isWithdrawalDialogOpen}
                    onOpenChange={setIsWithdrawalDialogOpen}
                    availableBalancePaise={walletSummary?.availableForWithdrawalPaise || 0}
                    onSuccess={loadData}
                />
            </div>
        </DashboardLayout>
    );
};

export default MerchantWallet;
