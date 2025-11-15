import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, DollarSign, TrendingUp, Plus, Minus, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WalletData {
  id: string;
  userId: string;
  storeId?: string;
  storeType: 'connected' | 'popup';
  balance: number;
  payoutBalance: number;
  pendingPayoutBalance: number;
  lifetimeEarnings: number;
  currency: string;
  lowBalanceThreshold: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  transactionId: string;
  category: 'fulfillment' | 'top_up' | 'payout' | 'customer_payment' | 'refund' | 'adjustment' | 'platform_fee';
  type: 'credit' | 'debit';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  affectsBalance: 'wallet' | 'payout' | 'both';
  description: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  adminId?: string;
  orderId?: string;
  payoutId?: string;
}

export const WalletManagement = () => {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit');
  const [creditDebitOpen, setCreditDebitOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockWallets: WalletData[] = [
      {
        id: '1',
        userId: 'user_001',
        storeId: 'store_001',
        storeType: 'connected',
        balance: 250.50,
        payoutBalance: 0,
        pendingPayoutBalance: 0,
        lifetimeEarnings: 0,
        currency: 'USD',
        lowBalanceThreshold: 20,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        userId: 'user_002',
        storeId: 'store_002',
        storeType: 'popup',
        balance: 1500.00,
        payoutBalance: 850.75,
        pendingPayoutBalance: 125.50,
        lifetimeEarnings: 3250.00,
        currency: 'USD',
        lowBalanceThreshold: 20,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        userId: 'user_003',
        storeId: 'store_003',
        storeType: 'popup',
        balance: 50.25,
        payoutBalance: 425.00,
        pendingPayoutBalance: 75.00,
        lifetimeEarnings: 1200.50,
        currency: 'USD',
        lowBalanceThreshold: 20,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setWallets(mockWallets);
  }, []);

  const handleCreditDebit = async () => {
    if (!selectedUserId || !amount || !description) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // In production, call API: POST /api/wallets/${userId}/credit or debit
      const wallet = wallets.find(w => w.userId === selectedUserId);
      if (wallet) {
        const newBalance = transactionType === 'credit' 
          ? wallet.balance + parseFloat(amount)
          : wallet.balance - parseFloat(amount);

        if (transactionType === 'debit' && newBalance < 0) {
          toast({
            title: 'Error',
            description: 'Insufficient balance',
            variant: 'destructive',
          });
          return;
        }

        setWallets(prev => prev.map(w => 
          w.userId === selectedUserId 
            ? { ...w, balance: newBalance, updatedAt: new Date().toISOString() }
            : w
        ));

        toast({
          title: 'Success',
          description: `Wallet ${transactionType}ed successfully`,
        });

        setAmount('');
        setDescription('');
        setCreditDebitOpen(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update wallet',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = (userId: string) => {
    // Mock transaction history
    const mockTransactions: Transaction[] = [
      { 
        id: '1', 
        transactionId: 'TXN-ABC123',
        category: 'adjustment',
        type: 'credit', 
        amount: 100, 
        balanceBefore: 150.50,
        balanceAfter: 250.50,
        affectsBalance: 'wallet',
        description: 'Manual credit by admin', 
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        adminId: 'admin_001' 
      },
      { 
        id: '2', 
        transactionId: 'TXN-DEF456',
        category: 'fulfillment',
        type: 'debit', 
        amount: 25.50, 
        balanceBefore: 250.50,
        balanceAfter: 225.00,
        affectsBalance: 'wallet',
        description: 'Order payment', 
        status: 'completed',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 86400000).toISOString(),
        orderId: 'ORD-12345'
      },
      { 
        id: '3', 
        transactionId: 'TXN-GHI789',
        category: 'top_up',
        type: 'credit', 
        amount: 500, 
        balanceBefore: 0,
        balanceAfter: 500,
        affectsBalance: 'wallet',
        description: 'Wallet top-up', 
        status: 'completed',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        completedAt: new Date(Date.now() - 172800000).toISOString()
      },
      { 
        id: '4', 
        transactionId: 'TXN-JKL012',
        category: 'customer_payment',
        type: 'credit', 
        amount: 45.75, 
        balanceBefore: 380.00,
        balanceAfter: 425.75,
        affectsBalance: 'payout',
        description: 'Customer order profit', 
        status: 'completed',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        completedAt: new Date(Date.now() - 259200000).toISOString(),
        orderId: 'ORD-67890'
      },
    ];
    setTransactions(mockTransactions);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Wallet Management</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {wallets.filter(w => w.storeType === 'popup').length} Popup Stores
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wallet Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${wallets.reduce((sum, w) => sum + w.balance, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fulfillment funds
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${wallets.reduce((sum, w) => sum + w.payoutBalance, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available for withdrawal
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${wallets.reduce((sum, w) => sum + w.lifetimeEarnings, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total store profits
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Store Type</TableHead>
                <TableHead>Wallet Balance</TableHead>
                <TableHead>Payout Balance</TableHead>
                <TableHead>Pending Payout</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-medium">{wallet.userId}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      wallet.storeType === 'popup' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {wallet.storeType === 'popup' ? 'Popup Store' : 'Connected'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${wallet.balance.toFixed(2)}</div>
                    {wallet.balance < wallet.lowBalanceThreshold && (
                      <span className="text-xs text-orange-600">Low balance</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {wallet.storeType === 'popup' ? (
                      <div className="font-medium text-green-600">
                        ${wallet.payoutBalance.toFixed(2)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {wallet.storeType === 'popup' ? (
                      <div className="text-muted-foreground">
                        ${wallet.pendingPayoutBalance.toFixed(2)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      wallet.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {wallet.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUserId(wallet.userId);
                          setTransactionType('credit');
                          setCreditDebitOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Credit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUserId(wallet.userId);
                          setTransactionType('debit');
                          setCreditDebitOpen(true);
                        }}
                      >
                        <Minus className="h-4 w-4 mr-1" />
                        Debit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUserId(wallet.userId);
                          loadTransactions(wallet.userId);
                          setHistoryOpen(true);
                        }}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Credit/Debit Dialog */}
      <Dialog open={creditDebitOpen} onOpenChange={setCreditDebitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {transactionType === 'credit' ? 'Credit' : 'Debit'} Wallet - {selectedUserId}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount ($)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Reason for transaction"
              />
            </div>
            <Button
              onClick={handleCreditDebit}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : `Confirm ${transactionType === 'credit' ? 'Credit' : 'Debit'}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Transaction History - {selectedUserId}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[500px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-xs">{txn.transactionId}</TableCell>
                    <TableCell className="text-sm">{new Date(txn.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {txn.category.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        txn.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {txn.type}
                      </span>
                    </TableCell>
                    <TableCell className={txn.type === 'credit' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {txn.type === 'credit' ? '+' : '-'}${txn.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-muted-foreground">${txn.balanceBefore.toFixed(2)}</div>
                        <div className="text-xs">→ ${txn.balanceAfter.toFixed(2)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="text-sm">{txn.description}</div>
                        {txn.orderId && (
                          <div className="text-xs text-muted-foreground mt-1">Order: {txn.orderId}</div>
                        )}
                        {txn.affectsBalance !== 'wallet' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                            Affects: {txn.affectsBalance}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
