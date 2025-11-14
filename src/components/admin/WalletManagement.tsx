import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WalletData {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  createdAt: string;
  adminId?: string;
}

export const WalletManagement = () => {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load mock data
    const mockWallets: WalletData[] = [
      { id: '1', userId: 'user1', balance: 1250.50, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '2', userId: 'user2', balance: 850.00, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '3', userId: 'user3', balance: 2100.75, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    setWallets(mockWallets);
  }, []);

  const handleCreditDebit = async (type: 'credit' | 'debit') => {
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
        const newBalance = type === 'credit' 
          ? wallet.balance + parseFloat(amount)
          : wallet.balance - parseFloat(amount);

        if (type === 'debit' && newBalance < 0) {
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
          description: `Wallet ${type}ed successfully`,
        });

        setAmount('');
        setDescription('');
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
    // In production, call: GET /api/wallets/${userId}/transactions
    const mockTransactions: Transaction[] = [
      { id: '1', type: 'credit', amount: 500, description: 'Order refund', createdAt: new Date().toISOString(), adminId: 'admin1' },
      { id: '2', type: 'debit', amount: 150, description: 'Service fee', createdAt: new Date().toISOString(), adminId: 'admin1' },
      { id: '3', type: 'credit', amount: 900, description: 'Bonus credit', createdAt: new Date().toISOString(), adminId: 'admin1' },
    ];
    setTransactions(mockTransactions);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Wallet Management</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${wallets.reduce((sum, w) => sum + w.balance, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(wallets.reduce((sum, w) => sum + w.balance, 0) / wallets.length || 0).toFixed(2)}
            </div>
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
                <TableHead>Balance</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-medium">{wallet.userId}</TableCell>
                  <TableCell>${wallet.balance.toFixed(2)}</TableCell>
                  <TableCell>{new Date(wallet.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUserId(wallet.userId)}
                          >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Credit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Credit Wallet</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>User ID</Label>
                              <Input value={selectedUserId} disabled />
                            </div>
                            <div>
                              <Label>Amount</Label>
                              <Input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Input 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Reason for credit"
                              />
                            </div>
                            <Button 
                              onClick={() => handleCreditDebit('credit')}
                              disabled={loading}
                              className="w-full"
                            >
                              Credit Wallet
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUserId(wallet.userId)}
                          >
                            <TrendingDown className="h-4 w-4 mr-1" />
                            Debit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Debit Wallet</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>User ID</Label>
                              <Input value={selectedUserId} disabled />
                            </div>
                            <div>
                              <Label>Amount</Label>
                              <Input 
                                type="number" 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Input 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Reason for debit"
                              />
                            </div>
                            <Button 
                              onClick={() => handleCreditDebit('debit')}
                              disabled={loading}
                              className="w-full"
                              variant="destructive"
                            >
                              Debit Wallet
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedUserId(wallet.userId);
                              loadTransactions(wallet.userId);
                            }}
                          >
                            History
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Transaction History - {selectedUserId}</DialogTitle>
                          </DialogHeader>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transactions.map((txn) => (
                                <TableRow key={txn.id}>
                                  <TableCell>
                                    <span className={txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                                      {txn.type === 'credit' ? '+' : '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell>${txn.amount.toFixed(2)}</TableCell>
                                  <TableCell>{txn.description}</TableCell>
                                  <TableCell>{new Date(txn.createdAt).toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
