import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    History,
    RefreshCw,
    Plus,
    Minus,
    CreditCard
} from 'lucide-react';
import { walletApi } from '@/lib/api';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Transaction {
    id: string;
    type: string;
    direction: string;
    amountPaise: number;
    amountRupees: string;
    status: string;
    source: string;
    referenceType: string;
    referenceId: string;
    description: string;
    balanceBeforePaise: number;
    balanceAfterPaise: number;
    createdAt: string;
    completedAt: string;
}

const WalletTransactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState<{ balancePaise: number; balanceRupees: string } | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [balanceData, txnData] = await Promise.all([
                walletApi.getBalance(),
                walletApi.getTransactions({ limit: 20 })
            ]);

            setWalletBalance(balanceData);

            // Handle both array and object response
            const transactions = Array.isArray(txnData) ? txnData : (txnData.data || []);
            const pagination = Array.isArray(txnData) ? null : txnData.pagination;

            setTransactions(transactions);
            setHasMore(pagination?.hasMore || false);
            setNextCursor(pagination?.nextCursor || null);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load transactions');
        } finally {
            setIsLoading(false);
        }
    };

    const loadMore = async () => {
        if (!nextCursor || isLoadingMore) return;

        try {
            setIsLoadingMore(true);
            const txnData = await walletApi.getTransactions({ limit: 20, cursor: nextCursor });

            const newTransactions = Array.isArray(txnData) ? txnData : (txnData.data || []);
            const pagination = Array.isArray(txnData) ? null : txnData.pagination;

            setTransactions(prev => [...prev, ...newTransactions]);
            setHasMore(pagination?.hasMore || false);
            setNextCursor(pagination?.nextCursor || null);
        } catch (error: any) {
            toast.error('Failed to load more transactions');
        } finally {
            setIsLoadingMore(false);
        }
    };

    const getTypeIcon = (type: string, direction: string) => {
        if (direction === 'CREDIT') {
            return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
        }
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'TOPUP': return 'Top-up';
            case 'DEBIT': return 'Payment';
            case 'REFUND': return 'Refund';
            case 'ADJUSTMENT': return 'Adjustment';
            default: return type;
        }
    };

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'RAZORPAY': return <CreditCard className="h-3 w-3" />;
            case 'ORDER': return <Wallet className="h-3 w-3" />;
            case 'ADMIN': return <Plus className="h-3 w-3" />;
            default: return null;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return <Badge variant="outline" className="bg-green-500/10 text-green-500">Success</Badge>;
            case 'PENDING':
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">Pending</Badge>;
            case 'FAILED':
                return <Badge variant="outline" className="bg-red-500/10 text-red-500">Failed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                        <Link to="/invoices" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Wallet & Invoices
                        </Link>
                    </Button>
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <History className="h-8 w-8" />
                                Transaction History
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                View all your wallet transactions
                            </p>
                        </div>
                        <Card className="p-4 bg-primary/5 border-primary/20">
                            <div className="flex items-center gap-3">
                                <Wallet className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Balance</p>
                                    <p className="text-xl font-bold">
                                        ₹{walletBalance ? walletBalance.balanceRupees : '0.00'}
                                    </p>
                                </div>
                                <Button size="sm" className="ml-4" asChild>
                                    <Link to="/wallet/top-up">
                                        <Plus className="h-3 w-3 mr-1" />
                                        Top Up
                                    </Link>
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>

                {isLoading ? (
                    <Card className="p-12 text-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading transactions...</p>
                    </Card>
                ) : transactions.length === 0 ? (
                    <Card className="p-12 text-center border-dashed">
                        <History className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-lg font-medium">No transactions yet</p>
                        <p className="text-muted-foreground mb-4">
                            Add money to your wallet to get started
                        </p>
                        <Button asChild>
                            <Link to="/wallet/top-up">
                                <Plus className="h-4 w-4 mr-2" />
                                Top Up Wallet
                            </Link>
                        </Button>
                    </Card>
                ) : (
                    <>
                        <Card className="overflow-hidden">
                            <div className="divide-y divide-border">
                                {transactions.map((txn) => (
                                    <div key={txn.id} className="p-4 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-full ${txn.direction === 'CREDIT'
                                                    ? 'bg-green-500/10'
                                                    : 'bg-red-500/10'
                                                    }`}>
                                                    {getTypeIcon(txn.type, txn.direction)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{getTypeLabel(txn.type)}</span>
                                                        {getStatusBadge(txn.status)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {txn.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                        {getSourceIcon(txn.source)}
                                                        <span>{txn.source}</span>
                                                        <span>•</span>
                                                        <span>
                                                            {new Date(txn.createdAt).toLocaleString(undefined, {
                                                                dateStyle: 'medium',
                                                                timeStyle: 'short'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-bold ${txn.direction === 'CREDIT'
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                    }`}>
                                                    {txn.direction === 'CREDIT' ? '+' : '-'}₹{txn.amountRupees}
                                                </p>
                                                {txn.status === 'SUCCESS' && txn.balanceAfterPaise !== undefined && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Balance: ₹{(txn.balanceAfterPaise / 100).toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {hasMore && (
                            <div className="mt-6 text-center">
                                <Button
                                    variant="outline"
                                    onClick={loadMore}
                                    disabled={isLoadingMore}
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        'Load More'
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default WalletTransactions;
