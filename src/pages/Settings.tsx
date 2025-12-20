import { useEffect, useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storeApi } from '@/lib/api';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layout/DashboardLayout';

const Settings = () => {
  const { selectedStore, refreshStores } = useStore();
  const { user } = useAuth();

  const [storeDescription, setStoreDescription] = useState('');
  const [storeTheme, setStoreTheme] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [savingStore, setSavingStore] = useState(false);

  useEffect(() => {
    if (selectedStore) {
      setStoreDescription((selectedStore as any).description || '');
      setStoreTheme((selectedStore as any).theme || '');
      setPrimaryColor((selectedStore as any).settings?.primaryColor || '');
    } else {
      setStoreDescription('');
      setStoreTheme('');
      setPrimaryColor('');
    }
  }, [selectedStore?.id, (selectedStore as any)?._id, (selectedStore as any)?.description, (selectedStore as any)?.theme, (selectedStore as any)?.settings?.primaryColor]);

  const handleStoreSave = async () => {
    if (!selectedStore) return;

    const storeId = (selectedStore as any).id || (selectedStore as any)._id;
    if (!storeId) return;

    try {
      setSavingStore(true);
      await storeApi.update(storeId, {
        description: storeDescription,
        theme: storeTheme || undefined,
        settings: {
          primaryColor: primaryColor || undefined,
        },
      });
      toast.success('Store settings updated');
      await refreshStores();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update store settings');
    } finally {
      setSavingStore(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account and preferences
            </p>
          </div>

          {/* Store Settings (store-aware via StoreContext) */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Store Settings</h2>
            {!selectedStore ? (
              <p className="text-sm text-muted-foreground">
                Select a store on the dashboard to view its settings.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={selectedStore.storeName || ''}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="storeSubdomain">Subdomain</Label>
                  <Input
                    id="storeSubdomain"
                    value={selectedStore.subdomain || ''}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="storeTheme">Theme</Label>
                  <Input
                    id="storeTheme"
                    value={storeTheme}
                    onChange={(e) => setStoreTheme(e.target.value)}
                    placeholder="e.g. modern"
                  />
                </div>
                <div>
                  <Label htmlFor="primaryColor">Primary Color (hex)</Label>
                  <Input
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#000000"
                  />
                </div>
                <div>
                  <Label htmlFor="storeDescription">Description</Label>
                  <textarea
                    id="storeDescription"
                    className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    rows={3}
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Store name and subdomain are managed in the Stores section. You can edit descriptive details here.
                  </p>
                  <Button size="sm" onClick={handleStoreSave} disabled={savingStore}>
                    {savingStore ? 'Saving...' : 'Save Store Settings'}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Profile Settings */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={user?.name} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} disabled />
              </div>
              <Button>Save Changes</Button>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order Updates</p>
                  <p className="text-sm text-muted-foreground">Get notified when orders are placed</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing Emails</p>
                  <p className="text-sm text-muted-foreground">Receive tips and updates from ShelfMerch</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-destructive">
            <h2 className="text-xl font-semibold mb-4 text-destructive">Danger Zone</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </div>
          </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
