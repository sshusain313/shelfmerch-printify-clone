import React, { useState } from 'react';
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
    Wallet
} from 'lucide-react';
import { toast } from 'sonner';

const WalletTopUp = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [amount, setAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setIsProcessing(true);

        // Simulate API call
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success(`Successfully added ₹${numAmount.toFixed(2)} to your wallet`);
            navigate('/invoices');
        } catch (error) {
            toast.error('Failed to top up wallet');
        } finally {
            setIsProcessing(false);
        }
    };

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
                                    ₹0.00
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Top Up Amount</CardTitle>
                                <CardDescription>Enter the amount you want to add to your wallet</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleTopUp} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount (₹)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                                            <Input
                                                id="amount"
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="pl-8 text-lg"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <Button type="submit" className="w-full h-11 text-lg" disabled={isProcessing}>
                                            {isProcessing ? (
                                                <>Processing Payment...</>
                                            ) : (
                                                <>
                                                    <CreditCard className="mr-2 h-5 w-5" />
                                                    Proceed to Pay ₹{amount || '0.00'}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    
                                    <p className="text-xs text-center text-muted-foreground pt-2">
                                        Payments are processed securely via Razorpay/Stripe.
                                    </p>
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
