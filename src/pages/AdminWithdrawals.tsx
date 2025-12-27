import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    CheckCircle2,
    Clock,
    XCircle,
    Banknote,
    ArrowLeft,
    RefreshCw,
    AlertCircle,
    Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { adminWithdrawalsApi } from '@/lib/api';
import { toast } from 'sonner';
import {
    ApproveWithdrawalDialog,
    RejectWithdrawalDialog,
    MarkPaidDialog,
} from '@/components/admin/withdrawals/WithdrawalDialogs';

interface WithdrawalRequest {
    id: string;
    merchantId: string;
    merchantEmail?: string;
    merchantName?: string;
    amountPaise: number;
    amountRupees: string;
    currency: string;
    upiId: string;
    status: string;
    requestedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    paidAt?: string;
    rejectionReason?: string;
    payoutMethod: string;
    payoutReference?: string;
    payoutNotes?: string;
}

interface WithdrawalStats {
    byStatus: Record<string, { count: number; totalPaise: number; totalRupees: string }>;
    todayApproved: { count: number; totalPaise: number; totalRupees: string };
    todayPaid: { count: number; totalPaise: number; totalRupees: string };
}

const AdminWithdrawals = () => {
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [stats, setStats] = useState<WithdrawalStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('PENDING');

    // Dialog states
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [isMarkPaidDialogOpen, setIsMarkPaidDialogOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [withdrawalsData, statsData] = await Promise.all([
                adminWithdrawalsApi.list({ status: activeTab, limit: 100 }),
                adminWithdrawalsApi.getStats(),
            ]);
            setWithdrawals(withdrawalsData.data || []);
            setStats(statsData);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to load data';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = (withdrawal: WithdrawalRequest, action: 'approve' | 'reject' | 'mark-paid') => {
        setSelectedWithdrawal(withdrawal);
        switch (action) {
            case 'approve':
                setIsApproveDialogOpen(true);
                break;
            case 'reject':
                setIsRejectDialogOpen(true);
                break;
            case 'mark-paid':
                setIsMarkPaidDialogOpen(true);
                break;
        }
    };

    const getStatusBadge = (status: string) => {
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

    const pendingCount = stats?.byStatus?.PENDING?.count || 0;
    const approvedCount = stats?.byStatus?.APPROVED?.count || 0;

    return (
        <div className="min-h-screen bg-background">
            {/* Simple Header */}
            <header className="border-b bg-card sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/admin">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Admin
                            </Link>
                        </Button>
                        <h1 className="text-xl font-bold">Withdrawal Requests</h1>
                    </div>
                    <Button variant="ghost" size="sm" onClick={loadData} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-yellow-500/10">
                                    <Clock className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Pending</p>
                                    <p className="text-2xl font-bold">{pendingCount}</p>
                                    <p className="text-xs text-muted-foreground">
                                        ₹{stats?.byStatus?.PENDING?.totalRupees || '0.00'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-500/10">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Awaiting Payout</p>
                                    <p className="text-2xl font-bold">{approvedCount}</p>
                                    <p className="text-xs text-muted-foreground">
                                        ₹{stats?.byStatus?.APPROVED?.totalRupees || '0.00'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-green-500/10">
                                    <Banknote className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Paid Today</p>
                                    <p className="text-2xl font-bold">{stats?.todayPaid?.count || 0}</p>
                                    <p className="text-xs text-muted-foreground">
                                        ₹{stats?.todayPaid?.totalRupees || '0.00'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-purple-500/10">
                                    <Users className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Total Paid</p>
                                    <p className="text-2xl font-bold">{stats?.byStatus?.PAID?.count || 0}</p>
                                    <p className="text-xs text-muted-foreground">
                                        ₹{stats?.byStatus?.PAID?.totalRupees || '0.00'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="PENDING" className="gap-2">
                            <Clock className="h-4 w-4" />
                            Pending
                            {pendingCount > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {pendingCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="APPROVED" className="gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Approved
                            {approvedCount > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {approvedCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="PAID" className="gap-2">
                            <Banknote className="h-4 w-4" />
                            Paid
                        </TabsTrigger>
                        <TabsTrigger value="REJECTED" className="gap-2">
                            <XCircle className="h-4 w-4" />
                            Rejected
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab}>
                        {isLoading ? (
                            <Card className="p-12 text-center">
                                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Loading withdrawal requests...</p>
                            </Card>
                        ) : withdrawals.length === 0 ? (
                            <Card className="p-12 text-center border-dashed">
                                <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-lg font-medium">No {activeTab.toLowerCase()} requests</p>
                                <p className="text-muted-foreground">
                                    Withdrawal requests with this status will appear here.
                                </p>
                            </Card>
                        ) : (
                            <Card className="overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Merchant
                                                </th>
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
                                                <th className="px-6 py-4 text-right text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {withdrawals.map((w) => (
                                                <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="font-medium">{w.merchantName || 'N/A'}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {w.merchantEmail}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-lg font-bold">₹{w.amountRupees}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-sm">{w.upiId}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {getStatusBadge(w.status)}
                                                        {w.status === 'REJECTED' && w.rejectionReason && (
                                                            <p className="text-xs text-red-500 mt-1 max-w-[200px] truncate">
                                                                {w.rejectionReason}
                                                            </p>
                                                        )}
                                                        {w.payoutReference && (
                                                            <p className="text-xs text-green-600 mt-1 font-mono">
                                                                UTR: {w.payoutReference}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                                        {new Date(w.requestedAt).toLocaleDateString(undefined, {
                                                            dateStyle: 'medium',
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {w.status === 'PENDING' && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-green-600 hover:bg-green-700"
                                                                        onClick={() => handleAction(w, 'approve')}
                                                                    >
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => handleAction(w, 'reject')}
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {w.status === 'APPROVED' && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                    onClick={() => handleAction(w, 'mark-paid')}
                                                                >
                                                                    Mark as Paid
                                                                </Button>
                                                            )}
                                                            {(w.status === 'PAID' || w.status === 'REJECTED') && (
                                                                <span className="text-sm text-muted-foreground">—</span>
                                                            )}
                                                        </div>
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
            </main>

            {/* Dialogs */}
            <ApproveWithdrawalDialog
                open={isApproveDialogOpen}
                onOpenChange={setIsApproveDialogOpen}
                withdrawal={selectedWithdrawal}
                onSuccess={loadData}
            />
            <RejectWithdrawalDialog
                open={isRejectDialogOpen}
                onOpenChange={setIsRejectDialogOpen}
                withdrawal={selectedWithdrawal}
                onSuccess={loadData}
            />
            <MarkPaidDialog
                open={isMarkPaidDialogOpen}
                onOpenChange={setIsMarkPaidDialogOpen}
                withdrawal={selectedWithdrawal}
                onSuccess={loadData}
            />
        </div>
    );
};

export default AdminWithdrawals;
