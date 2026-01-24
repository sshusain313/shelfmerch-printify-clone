import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Package,
    Store,
    TrendingUp,
    ShoppingBag,
    Users,
    Settings,
    LogOut,
    FileText,
    CreditCard,
    ArrowLeft,
    Wallet,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { walletApi } from '@/lib/api';

declare global {
    interface Window {
        Razorpay: any;
    }
}

const WalletTopUp = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [amount, setAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [walletBalance, setWalletBalance] = useState<{ balancePaise: number; balanceRupees: string } | null>(null);
    const [isLoadingBalance, setIsLoadingBalance] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');

    useEffect(() => {
        loadWalletBalance();
    }, []);

    const loadWalletBalance = async () => {
        try {
            setIsLoadingBalance(true);
            const balance = await walletApi.getBalance();
            setWalletBalance(balance);
        } catch (error: any) {
            console.error('Failed to load wallet balance:', error);
            toast.error('Failed to load wallet balance');
        } finally {
            setIsLoadingBalance(false);
        }
    };

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (numAmount < 1) {
            toast.error('Minimum top-up amount is ₹1');
            return;
        }

        if (numAmount > 100000) {
            toast.error('Maximum top-up amount is ₹1,00,000');
            return;
        }

        setIsProcessing(true);
        setPaymentStatus('pending');

        try {
            // Convert to paise
            const amountPaise = Math.round(numAmount * 100);

            // Create Razorpay order (API returns { data: { ... } })
            const res = await walletApi.createTopupOrder(amountPaise) as any;
            const orderData = res?.data ?? res;

            if (!orderData?.razorpayOrderId || !orderData?.razorpayKeyId) {
                throw new Error('Invalid create-order response');
            }

            // Open Razorpay Checkout
            openRazorpayCheckout(
                orderData.razorpayOrderId,
                orderData.razorpayKeyId,
                orderData.amountPaise ?? amountPaise,
                orderData.currency ?? 'INR'
            );
        } catch (error: any) {
            console.error('Top-up error:', error);
            toast.error(error?.message || 'Failed to create payment order');
            setPaymentStatus('failed');
            setIsProcessing(false);
        }
    };

    const openRazorpayCheckout = (
        orderId: string,
        keyId: string,
        amountPaise: number,
        currency: string
    ) => {
        const options = {
            key: keyId,
            amount: amountPaise,
            currency: currency,
            name: 'ShelfMerch',
            description: 'Wallet Top-up',
            order_id: orderId,
            handler: async function (response: any) {
                setPaymentStatus('success');
                const orderId = response.razorpay_order_id;
                const paymentId = response.razorpay_payment_id;
                const signature = response.razorpay_signature;

                if (!orderId || !paymentId || !signature) {
                    toast.error('Invalid payment response');
                    setIsProcessing(false);
                    setAmount('');
                    setPaymentStatus('idle');
                    return;
                }

                try {
                    const verified = await walletApi.verifyTopup(orderId, paymentId, signature) as any;
                    const data = verified?.data ?? verified;
                    if (data?.credited) {
                        toast.success('Payment successful! Wallet updated.');
                        if (typeof data.balanceRupees === 'string') {
                            setWalletBalance({ balancePaise: data.balancePaise ?? 0, balanceRupees: data.balanceRupees });
                        }
                    } else {
                        toast.success('Payment successful! Your wallet will be credited shortly.');
                    }
                } catch (e: any) {
                    console.error('Verify top-up error:', e);
                    toast.success('Payment successful! Your wallet will be credited shortly.');
                    // Webhook may still credit; refresh balance after a short delay
                    setTimeout(() => loadWalletBalance(), 2000);
                } finally {
                    await loadWalletBalance();
                    setIsProcessing(false);
                    setAmount('');
                    setPaymentStatus('idle');
                }
            },
            prefill: {
                email: user?.email || ''
            },
            theme: {
                color: '#6366f1'
            },
            modal: {
                ondismiss: function () {
                    setIsProcessing(false);
                    setPaymentStatus('idle');
                    toast.info('Payment cancelled');
                }
            }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response: any) {
            console.error('Payment failed:', response.error);
            setPaymentStatus('failed');
            setIsProcessing(false);
            toast.error(response.error.description || 'Payment failed');
        });
        razorpay.open();
    };

    const quickAmounts = [100, 500, 1000, 5000];

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar - Reusing Orders sidebar logic */}
            <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card p-6">
                <Link to="/" className="flex items-center space-x-2 mb-8">
                    <span className="font-heading text-xl font-bold text-foreground">
                        Shelf<span className="text-primary">Merch</span>
                    </span>
                </Link>

                <nav className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/dashboard">
                            <Package className="mr-2 h-4 w-4" />
                            My Products
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/orders">
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            Orders
                        </Link>
                    </Button>
                    <Button variant="secondary" className="w-full justify-start" asChild>
                        <Link to="/invoices">
                            <FileText className="mr-2 h-4 w-4" />
                            Wallet & Invoices
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/customers">
                            <Users className="mr-2 h-4 w-4" />
                            Customers
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/stores">
                            <Store className="mr-2 h-4 w-4" />
                            My Stores
                        </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/analytics">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Analytics
                        </Link>
                    </Button>
                    {isAdmin && (
                        <Button variant="ghost" className="w-full justify-start" asChild>
                            <Link to="/admin">
                                <Users className="mr-2 h-4 w-4" />
                                Admin Panel
                            </Link>
                        </Button>
                    )}
                    <Button variant="ghost" className="w-full justify-start" asChild>
                        <Link to="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Link>
                    </Button>
                </nav>

                <div className="absolute bottom-6 left-6 right-6">
                    <div className="border-t pt-4 space-y-2">
                        <p className="text-sm text-muted-foreground">Signed in as</p>
                        <p className="text-sm font-medium">{user?.email}</p>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-destructive hover:text-destructive"
                            onClick={logout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <Button variant="ghost" asChild className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                            <Link to="/invoices" className="flex items-center gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Wallet & Invoices
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold">Add Money to Wallet</h1>
                        <p className="text-muted-foreground mt-1">
                            Top up your wallet balance to pay for fulfillment orders
                        </p>
                    </div>

                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Current Balance</CardTitle>
                                <CardDescription>Your available funds for order fulfillment</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-3xl font-bold text-primary">
                                    <Wallet className="h-8 w-8" />
                                    {isLoadingBalance ? (
                                        <span className="animate-pulse">Loading...</span>
                                    ) : (
                                        <span>₹{walletBalance?.balanceRupees || '0.00'}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {paymentStatus === 'success' && (
                            <Card className="border-green-500/50 bg-green-500/5">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-3 text-green-600">
                                        <CheckCircle2 className="h-6 w-6" />
                                        <div>
                                            <p className="font-semibold">Payment Successful!</p>
                                            <p className="text-sm text-muted-foreground">
                                                Your wallet balance is being updated. This may take a few seconds.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>Top Up Amount</CardTitle>
                                <CardDescription>Enter the amount you want to add to your wallet</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleTopUp} className="space-y-4">
                                    {/* Quick amount buttons */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {quickAmounts.map((quickAmt) => (
                                            <Button
                                                key={quickAmt}
                                                type="button"
                                                variant={amount === quickAmt.toString() ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setAmount(quickAmt.toString())}
                                            >
                                                ₹{quickAmt.toLocaleString()}
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount (₹)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                                            <Input
                                                id="amount"
                                                type="number"
                                                min="1"
                                                max="100000"
                                                step="1"
                                                placeholder="0.00"
                                                className="pl-8 text-lg"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                required
                                                disabled={isProcessing}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Min: ₹1 | Max: ₹1,00,000
                                        </p>
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            type="submit"
                                            className="w-full h-11 text-lg"
                                            disabled={isProcessing || !amount || parseFloat(amount) < 1}
                                        >
                                            {isProcessing ? (
                                                <>Processing Payment...</>
                                            ) : (
                                                <>
                                                    <CreditCard className="mr-2 h-5 w-5" />
                                                    Proceed to Pay ₹{amount || '0'}
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    <div className="flex items-start gap-2 pt-2 text-xs text-muted-foreground">
                                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                        <p>
                                            Payments are processed securely via Razorpay. Your wallet will be credited
                                            once payment is confirmed (usually within a few seconds).
                                        </p>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WalletTopUp;

