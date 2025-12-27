import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { withdrawalApi } from '@/lib/api';

interface WithdrawalRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableBalancePaise: number;
    onSuccess: () => void;
}

const WithdrawalRequestDialog: React.FC<WithdrawalRequestDialogProps> = ({
    open,
    onOpenChange,
    availableBalancePaise,
    onSuccess,
}) => {
    const [amount, setAmount] = useState<string>('');
    const [upiId, setUpiId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ amount?: string; upiId?: string }>({});

    const validateForm = (): boolean => {
        const newErrors: { amount?: string; upiId?: string } = {};

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            newErrors.amount = 'Please enter a valid amount';
        } else if (numAmount < 100) {
            newErrors.amount = 'Minimum withdrawal amount is ₹100';
        } else if (numAmount * 100 > availableBalancePaise) {
            newErrors.amount = `Maximum available: ₹${(availableBalancePaise / 100).toFixed(2)}`;
        }

        if (!upiId.trim()) {
            newErrors.upiId = 'UPI ID is required';
        } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upiId.trim())) {
            newErrors.upiId = 'Invalid UPI ID format (e.g., name@upi)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const amountPaise = Math.round(parseFloat(amount) * 100);
            await withdrawalApi.create({
                amountPaise,
                upiId: upiId.trim().toLowerCase(),
            });

            toast.success('Withdrawal request submitted successfully');
            setAmount('');
            setUpiId('');
            setErrors({});
            onOpenChange(false);
            onSuccess();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to submit withdrawal request';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setAmount('');
            setUpiId('');
            setErrors({});
            onOpenChange(false);
        }
    };

    const availableRupees = (availableBalancePaise / 100).toFixed(2);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Request Withdrawal
                    </DialogTitle>
                    <DialogDescription>
                        Enter the amount and UPI ID for payout. Minimum withdrawal is ₹100.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Available Balance */}
                        <div className="rounded-lg bg-muted/50 p-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Available for Withdrawal
                            </p>
                            <p className="text-2xl font-bold text-primary">₹{availableRupees}</p>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    ₹
                                </span>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="100"
                                    step="1"
                                    placeholder="0.00"
                                    className={`pl-8 ${errors.amount ? 'border-destructive' : ''}`}
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        if (errors.amount) setErrors({ ...errors, amount: undefined });
                                    }}
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.amount && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.amount}
                                </p>
                            )}
                        </div>

                        {/* UPI ID Input */}
                        <div className="space-y-2">
                            <Label htmlFor="upiId">UPI ID</Label>
                            <Input
                                id="upiId"
                                type="text"
                                placeholder="name@upi"
                                className={errors.upiId ? 'border-destructive' : ''}
                                value={upiId}
                                onChange={(e) => {
                                    setUpiId(e.target.value);
                                    if (errors.upiId) setErrors({ ...errors, upiId: undefined });
                                }}
                                disabled={isSubmitting}
                            />
                            {errors.upiId && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.upiId}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Enter your UPI ID where you want to receive the payout
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !amount || !upiId}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Request'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default WithdrawalRequestDialog;
