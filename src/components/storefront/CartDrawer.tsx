import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { CartItem } from '@/types';
import { useStoreAuth } from '@/contexts/StoreAuthContext';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, variant: any, quantity: number) => void;
  onRemove: (productId: string, variant: any) => void;
  onCheckout: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  onClose,
  cart,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}) => {
  const { isAuthenticated } = useStoreAuth();
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price || 0) * (item.quantity || 0), 0);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({cart.length})
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground">Add some products to get started!</p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {cart.map((item) => {
                  const mockup = item.product.mockupUrls?.[0] || item.product.mockupUrl;
                  const price = item.product.price || 0;
                  return (
                    <div
                      key={`${item.productId}-${item.variant.color}-${item.variant.size}`}
                      className="flex gap-4"
                    >
                      <div className="w-20 h-20 bg-muted rounded-md flex-shrink-0">
                        {mockup ? (
                          <img
                            src={mockup}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ShoppingCart className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.variant.color} / {item.variant.size}
                        </p>
                        <p className="font-semibold text-primary">${price.toFixed(2)}</p>

                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              onUpdateQuantity(item.productId, item.variant, Math.max(0, item.quantity - 1))
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              onUpdateQuantity(item.productId, item.variant, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 ml-auto text-destructive"
                            onClick={() => onRemove(item.productId, item.variant)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-xs text-muted-foreground">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Estimated Total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={onCheckout}>
                {isAuthenticated ? 'Proceed to Checkout' : 'Login / Register to Checkout'}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
