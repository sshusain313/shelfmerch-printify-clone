import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, TrendingUp, Plus, Minus, History, RefreshCw, Search, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminWalletApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface WalletData {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  balancePaise: number;
  balanceRupees: string;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  type: string;
  direction: string;
  amountPaise: number;
  amountRupees: string;
  status: string;
  source: string;
  description: string;
  adminId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
  completedAt: string;
}

interface WalletStats {
  totalWallets: number;
  activeWallets: number;
  lockedWallets: number;
  totalBalancePaise: number;
  totalBalanceRupees: string;
  transactionsByType: Record<string, {
    count: number;
    totalPaise: number;
    totalRupees: string;
  }>;
}

export const WalletManagement = () => {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWallets();
    loadStats();
  }, []);

  const loadWallets = async () => {
    try {
      setLoadingWallets(true);
      const response = await adminWalletApi.listWallets({ search: searchQuery || undefined });
      const walletList = Array.isArray(response) ? response : (response.data || []);
      setWallets(walletList);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load wallets';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoadingWallets(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const response = await adminWalletApi.getStats();
      setStats(response);
    } catch (error: unknown) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadWallets();
  };

  const handleAdjustBalance = async () => {
    if (!selectedWallet || !amount || !reason) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid positive amount',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const amountPaise = Math.round(amountNum * 100);

      const response = await adminWalletApi.adjustBalance({
        userId: selectedWallet.userId,
        direction: adjustmentType,
        amountPaise,
        reason,
      });

      toast({
        title: 'Success',
        description: `Successfully ${adjustmentType.toLowerCase()}ed ₹${amountNum.toFixed(2)}. New balance: ₹${response.newBalanceRupees}`,
      });

      // Update wallet in list
      setWallets(prev => prev.map(w =>
        w.userId === selectedWallet.userId
          ? { ...w, balancePaise: response.newBalancePaise, balanceRupees: response.newBalanceRupees }
          : w
      ));

      // Refresh stats
      loadStats();

      setAmount('');
      setReason('');
      setAdjustModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to adjust balance';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionHistory = async (wallet: WalletData) => {
    setSelectedWallet(wallet);
    setHistoryModalOpen(true);

    try {
      const response = await adminWalletApi.getTransactions(wallet.userId, { limit: 50 });
      const txnList = Array.isArray(response) ? response : (response.data || []);
      setTransactions(txnList);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: 'Failed to load transaction history',
        variant: 'destructive',
      });
    }
  };

  const openAdjustModal = (wallet: WalletData, type: 'CREDIT' | 'DEBIT') => {
    setSelectedWallet(wallet);
    setAdjustmentType(type);
    setAdjustModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Wallets</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? '...' : stats?.totalWallets || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Wallet className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Wallets</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? '...' : stats?.activeWallets || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold">
                  ₹{loadingStats ? '...' : stats?.totalBalanceRupees || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <History className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top-ups</p>
                <p className="text-2xl font-bold">
                  {loadingStats ? '...' : stats?.transactionsByType?.TOPUP?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Wallets Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              User Wallets
            </CardTitle>
            <div className="flex gap-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Button type="submit" variant="secondary" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              <Button variant="outline" onClick={() => { setSearchQuery(''); loadWallets(); }}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingWallets ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No wallets found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((wallet) => (
                  <TableRow key={wallet.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{wallet.userName || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{wallet.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-lg">₹{wallet.balanceRupees}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={wallet.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {wallet.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(wallet.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAdjustModal(wallet, 'CREDIT')}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Credit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAdjustModal(wallet, 'DEBIT')}
                        >
                          <Minus className="h-3 w-3 mr-1" />
                          Debit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => loadTransactionHistory(wallet)}
                        >
                          <History className="h-3 w-3 mr-1" />
                          History
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Adjust Balance Modal */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {adjustmentType === 'CREDIT' ? (
                <><Plus className="h-5 w-5 text-green-500" /> Credit Wallet</>
              ) : (
                <><Minus className="h-5 w-5 text-red-500" /> Debit Wallet</>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedWallet && (
                <span>
                  Adjusting wallet for <strong>{selectedWallet.userEmail}</strong>
                  <br />
                  Current balance: <strong>₹{selectedWallet.balanceRupees}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (required for audit)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Refund for order #123, Bonus credit, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdjustBalance}
              disabled={loading || !amount || !reason}
              className={adjustmentType === 'CREDIT' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {loading ? 'Processing...' : `${adjustmentType === 'CREDIT' ? 'Credit' : 'Debit'} ₹${amount || '0'}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </DialogTitle>
            <DialogDescription>
              {selectedWallet && (
                <span>
                  Showing transactions for <strong>{selectedWallet.userEmail}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No transactions found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(txn.createdAt).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{txn.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {txn.description}
                    </TableCell>
                    <TableCell>
                      <span className={txn.direction === 'CREDIT' ? 'text-green-600' : 'text-red-600'}>
                        {txn.direction === 'CREDIT' ? '+' : '-'}₹{txn.amountRupees}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={txn.status === 'SUCCESS' ? 'default' : 'secondary'}
                        className={txn.status === 'SUCCESS' ? 'bg-green-500' : ''}
                      >
                        {txn.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
