import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CartItem, Store, ShippingAddress } from '@/types';
import { getTheme } from '@/lib/themes';
import { storeApi, checkoutApi } from '@/lib/api';
import { useStoreAuth } from '@/contexts/StoreAuthContext';
import {
  ArrowLeft,
  CreditCard,
  Truck,
  ShieldCheck,
  Lock,
  Loader2,
} from 'lucide-react';

const defaultShipping: ShippingAddress = {
  fullName: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'United States',
};

const StoreCheckoutPage: React.FC = () => {
  const { subdomain } = useParams<{ subdomain: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { cart?: CartItem[]; storeId?: string; subdomain?: string } | null;
  const [store, setStore] = useState<Store | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shippingInfo, setShippingInfo] = useState<ShippingAddress>(defaultShipping);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');

  useEffect(() => {
    const load = async () => {
      if (!subdomain) return;
      try {
        const resp = await storeApi.getBySubdomain(subdomain);
        if (resp.success && resp.data) {
          setStore(resp.data as Store);
        } else {
          setStore(null);
        }
      } catch (err) {
        console.error('Failed to fetch store for checkout:', err);
        setStore(null);
      }
    };

    load();
  }, [subdomain]);

  useEffect(() => {
    // Initialize cart from navigation state; if state is missing, keep empty cart
    if (locationState?.cart && Array.isArray(locationState.cart)) {
      setCart(locationState.cart);
    }
  }, [locationState]);

  const { isAuthenticated } = useStoreAuth();

  useEffect(() => {
    if (store && !isAuthenticated) {
      // Redirect to auth page, preserving the cart state so it's available after login
      navigate(`/store/${store.subdomain}/auth?redirect=checkout`, {
        state: locationState
      });
    }
  }, [isAuthenticated, store, navigate, locationState]);

  const theme = store ? getTheme(store.theme) : getTheme('modern');

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);
  const shipping = cart.length > 0 ? 5.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const validateShipping = () => {
    const required: (keyof ShippingAddress)[] = ['fullName', 'email', 'phone', 'address1', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!shippingInfo[field]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    return true;
  };

  const handleContinueToPayment = () => {
    if (validateShipping()) {
      setStep('payment');
    }
  };

  const handlePlaceOrder = async () => {
    if (!store) return;
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!validateShipping()) {
      return;
    }

    setProcessing(true);
    try {
      const resp = await checkoutApi.placeOrder(store.subdomain, {
        cart,
        shippingInfo,
      });

      if (!resp.success || !resp.data) {
        throw new Error(resp.message || 'Failed to place order');
      }

      const order = resp.data;

      setCart([]);
      toast.success('Order placed successfully!');

      navigate('/order-confirmation', { state: { order } });
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error?.message || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  const handleBackToStore = () => {
    if (!store) return;
    navigate(`/store/${store.subdomain}`);
  };

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <h1 className="text-3xl font-bold mb-3">Checkout unavailable</h1>
        <p className="text-muted-foreground mb-6">
          The store you are trying to access is not available at the moment.
        </p>
        <Button asChild>
          <Link to="/">Go back to ShelfMerch</Link>
        </Button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <h1 className="text-3xl font-bold mb-3">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">
          Add items to your cart before proceeding to checkout.
        </p>
        <Button onClick={handleBackToStore}>Back to store</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: theme.fonts.body }}>
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToStore}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue shopping
            </Button>
            <Separator orientation="vertical" className="hidden h-6 md:block" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Checkout</p>
              <h1 className="text-lg font-semibold" style={{ fontFamily: theme.fonts.heading }}>
                {store.storeName}
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <Lock className="h-4 w-4" />
            Secure checkout
          </div>
        </div>
      </header>

      <main className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-8">
          <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 1</p>
              <h2 className="text-2xl font-semibold" style={{ fontFamily: theme.fonts.heading }}>
                Shipping information
              </h2>
              <p className="text-sm text-muted-foreground">
                Provide your contact and delivery details so we know where to send your order.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="fullName">Full name *</Label>
                <Input id="fullName" name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} placeholder="Alex Johnson" required />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" value={shippingInfo.email} onChange={handleInputChange} placeholder="you@example.com" required />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" name="phone" type="tel" value={shippingInfo.phone} onChange={handleInputChange} placeholder="(555) 123-4567" required />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address1">Address line 1 *</Label>
                <Input id="address1" name="address1" value={shippingInfo.address1} onChange={handleInputChange} placeholder="123 Market Street" required />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address2">Address line 2</Label>
                <Input id="address2" name="address2" value={shippingInfo.address2} onChange={handleInputChange} placeholder="Apartment, suite, etc." />
              </div>
              <div>
                <Label htmlFor="city">City *</Label>
                <Input id="city" name="city" value={shippingInfo.city} onChange={handleInputChange} placeholder="San Francisco" required />
              </div>
              <div>
                <Label htmlFor="state">State / Province *</Label>
                <Input id="state" name="state" value={shippingInfo.state} onChange={handleInputChange} placeholder="California" required />
              </div>
              <div>
                <Label htmlFor="zipCode">Postal code *</Label>
                <Input id="zipCode" name="zipCode" value={shippingInfo.zipCode} onChange={handleInputChange} placeholder="94103" required />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" value={shippingInfo.country} onChange={handleInputChange} placeholder="United States" />
              </div>
            </div>
            {step === 'shipping' ? (
              <div className="flex justify-end">
                <Button size="lg" onClick={handleContinueToPayment}>
                  Continue to payment
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3 text-sm">
                <span className="font-medium">Shipping details confirmed</span>
                <Button variant="link" className="h-auto p-0" onClick={() => setStep('shipping')}>
                  Edit
                </Button>
              </div>
            )}
          </div>

          {step === 'payment' && (
            <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 2</p>
                <h2 className="text-2xl font-semibold" style={{ fontFamily: theme.fonts.heading }}>
                  Payment details
                </h2>
                <p className="text-sm text-muted-foreground">
                  We use secure encryption to protect your payment information.
                </p>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label htmlFor="cardName">Name on card</Label>
                  <Input id="cardName" placeholder="Alex Johnson" />
                </div>
                <div>
                  <Label htmlFor="cardNumber">Card number</Label>
                  <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="expiry">Expiry date</Label>
                    <Input id="expiry" placeholder="MM / YY" />
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Your payment is securely processed and never stored on our servers.
              </div>

              <div className="flex justify-end">
                <Button size="lg" onClick={handlePlaceOrder} disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing order
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" /> Place order
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <Card className="space-y-4 p-6 shadow-sm">
            <div>
              <h3 className="text-lg font-semibold" style={{ fontFamily: theme.fonts.heading }}>
                Order summary
              </h3>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {cart.length} {cart.length === 1 ? 'item' : 'items'} in cart
              </p>
            </div>
            <Separator />
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={`${item.productId}-${item.variant.color}-${item.variant.size}`} className="flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.variant.color} • {item.variant.size}
                    </p>
                    <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxes (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Card className="space-y-4 p-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <Truck className="h-4 w-4 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Fast fulfillment</p>
                <p>Orders ship within 3-5 business days after production.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Purchase protection</p>
                <p>30-day return policy. Contact us if anything isn&apos;t perfect.</p>
              </div>
            </div>
          </Card>
        </aside>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {store.storeName}. Powered by ShelfMerch.
        </div>
      </footer>
    </div>
  );
};

export default StoreCheckoutPage;
