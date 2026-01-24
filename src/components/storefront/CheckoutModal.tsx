import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { CartItem, ShippingAddress, Order } from '@/types';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  onPlaceOrder: (order: Omit<Order, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  storeId?: string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  open,
  onClose,
  cart,
  onPlaceOrder,
  storeId,
}) => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingInfo, setShippingInfo] = useState<ShippingAddress>({
    fullName: '',
    email: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = 5.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value,
    });
  };

  const validateShipping = () => {
    const required = ['fullName', 'email', 'phone', 'address1', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!shippingInfo[field as keyof ShippingAddress]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    return true;
  };

  const handleContinueToPayment = () => {
    if (validateShipping()) {
      setStep(2);
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const orderItems = cart.map((item) => {
      const primaryMockup = item.product.mockupUrls?.[0] || item.product.mockupUrl;
      return {
        productId: item.productId,
        productName: item.product.name,
        mockupUrl: primaryMockup,
        mockupUrls: item.product.mockupUrls,
        quantity: item.quantity,
        price: item.product.price,
        variant: item.variant,
      };
    });

    const order: Omit<Order, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      storeId,
      customerEmail: shippingInfo.email,
      items: orderItems,
      subtotal,
      shipping,
      tax,
      total,
      status: 'on-hold',
      shippingAddress: shippingInfo,
    };

    onPlaceOrder(order);
    setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step >= 1
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-muted-foreground/30 text-muted-foreground'
              }`}
            >
              1
            </div>
            <div className="w-16 h-0.5 bg-border" />
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step >= 2
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-muted-foreground/30 text-muted-foreground'
              }`}
            >
              2
            </div>
          </div>
          <div className="flex items-center justify-center gap-20">
            <span className={`text-sm ${step >= 1 ? 'font-semibold' : 'text-muted-foreground'}`}>
              Shipping
            </span>
            <span className={`text-sm ${step >= 2 ? 'font-semibold' : 'text-muted-foreground'}`}>
              Payment
            </span>
          </div>
        </div>

        {/* Step 1: Shipping Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={shippingInfo.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={shippingInfo.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={shippingInfo.phone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address1">Address Line 1 *</Label>
                <Input
                  id="address1"
                  name="address1"
                  value={shippingInfo.address1}
                  onChange={handleInputChange}
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address2">Address Line 2</Label>
                <Input
                  id="address2"
                  name="address2"
                  value={shippingInfo.address2}
                  onChange={handleInputChange}
                  placeholder="Apt 4B"
                />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={shippingInfo.city}
                  onChange={handleInputChange}
                  placeholder="New York"
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  value={shippingInfo.state}
                  onChange={handleInputChange}
                  placeholder="NY"
                  required
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={shippingInfo.zipCode}
                  onChange={handleInputChange}
                  placeholder="10001"
                  required
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={shippingInfo.country}
                  onChange={handleInputChange}
                  disabled
                />
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleContinueToPayment}>
              Continue to Payment
            </Button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <div className="space-y-6">
            <Card className="p-6 bg-muted/50">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({cart.length} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            <div className="p-6 border rounded-lg space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Payment Simulation</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                This is a demo checkout. No real payment will be processed. Click the button below
                to simulate a successful order placement.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back to Shipping
              </Button>
              <Button
                className="flex-1"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Place Order - ₹${total.toFixed(2)}`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
