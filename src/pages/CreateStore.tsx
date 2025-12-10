import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Store, Check, Loader2 } from 'lucide-react';
import { storeApi } from '@/lib/api';
import type { Store as StoreType } from '@/types';

const CreateStore = () => {
  const [storeName, setStoreName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storeName.trim()) {
      toast.error('Please enter a store name');
      return;
    }

    if (!user?.id) {
      toast.error('You must be logged in to create a store');
      return;
    }

    const subdomain = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    setIsCreating(true);

    try {
      // Create store in backend
      const response = await storeApi.create({
        name: storeName.trim(),
        theme: 'modern',
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create store');
      }

      const backendStore = response.data as StoreType;

      toast.success(
        `Store created! Your store is live at ${backendStore.subdomain}.shelfmerch.com`,
        { duration: 5000 }
      );

      navigate('/stores');
    } catch (error: any) {
      console.error('Error creating store:', error);
      toast.error(error.message || 'Failed to create store. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Create Your Store</h1>
          <p className="text-muted-foreground">
            Your product is saved! Now let's create your storefront.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                <Check className="w-4 h-4" />
              </div>
              <span className="font-medium">Product Created</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-primary">
                2
              </div>
              <span className="font-medium">Create Store</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-muted-foreground">
                3
              </div>
              <span className="text-muted-foreground">Go Live</span>
            </div>
          </div>
          <div className="w-full h-2 bg-muted rounded-full">
            <div className="w-1/3 h-2 bg-primary rounded-full" />
          </div>
        </div>

        <form onSubmit={handleCreateStore} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name</Label>
            <Input
              id="storeName"
              placeholder="My Awesome Store"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <Label className="text-sm text-muted-foreground mb-2 block">
              Your store URL will be:
            </Label>
            <p className="text-lg font-mono font-semibold">
              {storeName
                ? `${storeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.shelfmerch.com`
                : 'yourstore.shelfmerch.com'}
            </p>
          </div>

          <div className="bg-accent/50 border border-accent-foreground/20 rounded-lg p-4">
            <h3 className="font-semibold mb-2">What you get:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Custom branded storefront
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Secure checkout integration
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Automatic order fulfillment
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" />
                Real-time analytics dashboard
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/dashboard')}
              disabled={isCreating}
            >
              Skip for Now
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isCreating || !storeName.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Store...
                </>
              ) : (
                'Create Store'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateStore;
