import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Store as StoreIcon, Check, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Store, StoreTheme } from '@/types';
import { themes } from '@/lib/themes';

interface StoreWizardModalProps {
  open: boolean;
  onClose: () => void;
}

const StoreWizardModal: React.FC<StoreWizardModalProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<StoreTheme>('modern');
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const { saveStore } = useData();
  const navigate = useNavigate();

  const subdomain = storeName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const handleNext = () => {
    if (step === 1 && !storeName.trim()) {
      toast.error('Please enter a store name');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleCreateStore = async () => {
    if (!user?.id) return;

    setIsCreating(true);

    // Simulate creation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newStore: Store = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      storeName: storeName.trim(),
      subdomain,
      theme: selectedTheme,
      productIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveStore(newStore);

    toast.success(`🎉 Store created! Your store is live at ${subdomain}.shelfmerch.com`, {
      duration: 5000,
    });

    setIsCreating(false);
    onClose();
    
    // Navigate to stores page to see the new store
    setTimeout(() => {
      navigate('/stores');
    }, 500);
  };

  const handleSkip = () => {
    onClose();
    navigate('/dashboard');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <StoreIcon className="w-6 h-6 text-primary" />
            Create Your Store
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    step >= s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                <span
                  className={`text-sm font-medium ${
                    step >= s ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {s === 1 && 'Store Name'}
                  {s === 2 && 'Choose Theme'}
                  {s === 3 && 'Confirm'}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Store Name */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">What's your store name?</h3>
              <p className="text-muted-foreground">
                Choose a memorable name for your online store
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                placeholder="My Awesome Store"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="text-lg"
                autoFocus
              />
            </div>

            {storeName && (
              <div className="p-4 bg-muted rounded-lg">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Your store URL will be:
                </Label>
                <p className="text-lg font-mono font-semibold text-primary">
                  {subdomain || 'yourstore'}.shelfmerch.com
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleSkip}>
                Skip for Now
              </Button>
              <Button
                className="flex-1"
                onClick={handleNext}
                disabled={!storeName.trim()}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Theme */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">Choose a theme</h3>
              <p className="text-muted-foreground">
                Select a design that matches your brand style
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(themes).map((theme) => (
                <Card
                  key={theme.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedTheme === theme.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTheme(theme.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg mb-1">{theme.name}</h4>
                      <p className="text-xs text-muted-foreground">{theme.description}</p>
                    </div>
                    {selectedTheme === theme.id && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      {Object.entries(theme.colors)
                        .slice(0, 4)
                        .map(([name, color]) => (
                          <div
                            key={name}
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: color }}
                            title={name}
                          />
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{theme.preview}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleBack}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleNext}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Sparkles className="w-12 h-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Ready to launch!</h3>
              <p className="text-muted-foreground">
                Review your store details before going live
              </p>
            </div>

            <Card className="p-6 space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Store Name</Label>
                <p className="text-lg font-semibold">{storeName}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Store URL</Label>
                <p className="text-lg font-mono font-semibold text-primary">
                  {subdomain}.shelfmerch.com
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Theme</Label>
                <p className="text-lg font-semibold capitalize">{themes[selectedTheme].name}</p>
              </div>
            </Card>

            <div className="bg-accent/50 border border-accent-foreground/20 rounded-lg p-4">
              <h4 className="font-semibold mb-3">What's included:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Custom branded storefront
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Full shopping cart & checkout
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Order management dashboard
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Real-time analytics
                </li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleBack}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreateStore}
                disabled={isCreating}
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StoreWizardModal;
