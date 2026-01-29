import React, { useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Package, Home } from 'lucide-react';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const orderData = location.state?.order;
  const storeSlugFromState = location.state?.storeSlug || location.state?.storeSubdomain;

  // Derive storeSlug from order data or navigation state
  const storeSlug = useMemo(() => {
    if (!orderData) return storeSlugFromState || null;
    // Prefer explicit store/subdomain fields if backend includes them
    if (orderData.store?.subdomain) return orderData.store.subdomain;
    if (orderData.storeSlug) return orderData.storeSlug;
    if (orderData.storeSubdomain) return orderData.storeSubdomain;
    return storeSlugFromState || null;
  }, [orderData, storeSlugFromState]);

  useEffect(() => {
    // If no order data, redirect to home
    if (!orderData) {
      navigate('/');
    }
  }, [orderData, navigate]);

  if (!orderData) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground text-lg">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-2 gap-4 p-6 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <p className="font-semibold">#{orderData.id?.slice(0, 8).toUpperCase()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-semibold truncate">{orderData.customerEmail}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <p className="font-semibold capitalize">{orderData.status?.replace('-', ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total</p>
              <p className="font-semibold text-primary">₹{orderData.total?.toFixed(2)}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Items
            </h3>
            <div className="space-y-3">
              {orderData.items?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-2">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.variant?.color} / {item.variant?.size} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Shipping Address</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium">{orderData.shippingAddress?.fullName}</p>
              <p>{orderData.shippingAddress?.address1}</p>
              {orderData.shippingAddress?.address2 && <p>{orderData.shippingAddress.address2}</p>}
              <p>
                {orderData.shippingAddress?.city}, {orderData.shippingAddress?.state}{' '}
                {orderData.shippingAddress?.zipCode}
              </p>
              <p>{orderData.shippingAddress?.country}</p>
            </div>
          </div>
        </div>

        <div className="bg-accent/50 border border-accent-foreground/20 rounded-lg p-4 mb-6">
          <h4 className="font-semibold mb-2">What's Next?</h4>
          <ul className="space-y-2 text-sm">
            <li>✓ You'll receive an email confirmation shortly</li>
            <li>✓ Your order will be processed within 1-2 business days</li>
            <li>✓ Shipping typically takes 3-5 business days</li>
            <li>✓ Track your order status via the link in your email</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              if (storeSlug) {
                navigate(`/store/${storeSlug}/products`);
              } else {
                navigate(-1);
              }
            }}
          >
            <Home className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              if (storeSlug) {
                navigate(`/store/${storeSlug}`);
              } else {
                navigate('/');
              }
            }}
          >
            Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default OrderConfirmation;
