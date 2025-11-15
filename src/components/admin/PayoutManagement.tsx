import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Payout {
  id: string;
  payoutId: string;
  userId: string;
  storeId: string;
  amount: number;
  currency: string;
  payoutMethod: 'bank_transfer' | 'paypal';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  scheduledDate: string;
  processedDate?: string;
  completedDate?: string;
  failureReason?: string;
  createdAt: string;
}

export const PayoutManagement = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockPayouts: Payout[] = [
      {
        id: '1',
        payoutId: 'PO-202501-A1B2C',
        userId: 'user_002',
        storeId: 'store_002',
        amount: 500.00,
        currency: 'USD',
        payoutMethod: 'bank_transfer',
        status: 'completed',
        scheduledDate: new Date(Date.now() - 86400000).toISOString(),
        processedDate: new Date(Date.now() - 43200000).toISOString(),
        completedDate: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: '2',
        payoutId: 'PO-202501-D3E4F',
        userId: 'user_003',
        storeId: 'store_003',
        amount: 250.50,
        currency: 'USD',
        payoutMethod: 'bank_transfer',
        status: 'processing',
        scheduledDate: new Date().toISOString(),
        processedDate: new Date().toISOString(),
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '3',
        payoutId: 'PO-202501-G5H6I',
        userId: 'user_002',
        storeId: 'store_002',
        amount: 350.75,
        currency: 'USD',
        payoutMethod: 'paypal',
        status: 'pending',
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
    setPayouts(mockPayouts);
  }, []);

  const getStatusBadge = (status: Payout['status']) => {
    const variants: Record<Payout['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
      pending: { variant: 'outline', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      processing: { variant: 'outline', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      completed: { variant: 'outline', className: 'bg-green-50 text-green-700 border-green-200' },
      failed: { variant: 'destructive', className: '' },
      cancelled: { variant: 'secondary', className: '' },
    };

    return (
      <Badge variant={variants[status].variant} className={variants[status].className}>
        {status}
      </Badge>
    );
  };

  const handleUpdateStatus = async (payoutId: string, newStatus: Payout['status']) => {
    try {
      // In production, call API: PATCH /api/payouts/${payoutId}/status
      setPayouts(prev => prev.map(p => 
        p.payoutId === payoutId 
          ? { ...p, status: newStatus, processedDate: newStatus === 'processing' ? new Date().toISOString() : p.processedDate }
          : p
      ));

      toast({
        title: 'Success',
        description: `Payout status updated to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update payout status',
        variant: 'destructive',
      });
    }
  };

  const totalPending = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const totalProcessing = payouts.filter(p => p.status === 'processing').reduce((sum, p) => sum + p.amount, 0);
  const totalCompleted = payouts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Payout Management</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payouts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${totalPending.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {payouts.filter(p => p.status === 'pending').length} payouts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${totalProcessing.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {payouts.filter(p => p.status === 'processing').length} payouts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalCompleted.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {payouts.filter(p => p.status === 'completed').length} payouts
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payouts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payout ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell className="font-mono text-sm">{payout.payoutId}</TableCell>
                  <TableCell className="font-medium">{payout.userId}</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    ${payout.amount.toFixed(2)} {payout.currency}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {payout.payoutMethod === 'bank_transfer' ? 'Bank Transfer' : 'PayPal'}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(payout.status)}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(payout.scheduledDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm">
                    {payout.completedDate 
                      ? new Date(payout.completedDate).toLocaleDateString()
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {payout.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(payout.payoutId, 'processing')}
                        >
                          Process
                        </Button>
                      )}
                      {payout.status === 'processing' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 hover:bg-green-100"
                            onClick={() => handleUpdateStatus(payout.payoutId, 'completed')}
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-50 hover:bg-red-100"
                            onClick={() => handleUpdateStatus(payout.payoutId, 'failed')}
                          >
                            Fail
                          </Button>
                        </>
                      )}
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
