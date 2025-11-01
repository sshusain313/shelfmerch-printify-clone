import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Store as StoreIcon, Edit, Trash2, ExternalLink, Paintbrush, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Store } from '@/types';
import { themes } from '@/lib/themes';

interface ManageStoreDialogProps {
  open: boolean;
  onClose: () => void;
  store: Store | null;
}

const ManageStoreDialog: React.FC<ManageStoreDialogProps> = ({ open, onClose, store }) => {
  const navigate = useNavigate();
  const { saveStore } = useData();
  const [storeName, setStoreName] = useState(store?.storeName || '');
  const [description, setDescription] = useState(store?.description || '');
  const [selectedTheme, setSelectedTheme] = useState(store?.theme || 'modern');

  if (!store) return null;

  const handleSaveChanges = () => {
    const updatedStore: Store = {
      ...store,
      storeName: storeName.trim(),
      description: description.trim(),
      theme: selectedTheme as any,
      updatedAt: new Date().toISOString(),
    };

    saveStore(updatedStore);
    toast.success('Store settings updated!');
    onClose();
  };

  const handleDeleteStore = () => {
    if (confirm('Are you sure you want to delete this store? This action cannot be undone.')) {
      // For now, just show a message. In production, you'd implement actual deletion
      toast.error('Store deletion not implemented yet. This would remove the store from localStorage.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StoreIcon className="h-5 w-5" />
            Manage Store
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Store Information */}
          <Card className="p-4 bg-muted/50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Store URL</p>
                <p className="font-mono font-semibold">{store.subdomain}.shelfmerch.com</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Created</p>
                <p className="font-semibold">{new Date(store.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Builder</p>
                <p className="font-semibold">{store.useBuilder ? 'Enabled' : 'Disabled'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Theme</p>
                <p className="font-semibold capitalize">{store.theme}</p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full" asChild>
              <a href={`/store/${store.subdomain}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Store
              </a>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate(`/stores/${store.userId}/builder`)}>
              <Paintbrush className="h-4 w-4 mr-2" />
              Visual Builder
            </Button>
          </div>

          {/* Basic Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="storeName">Store Name</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="My Awesome Store"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is the display name of your store
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your store"
              />
            </div>

            <div>
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {Object.values(themes).map((theme) => (
                  <Card
                    key={theme.id}
                    className={`p-3 cursor-pointer transition-all ${
                      selectedTheme === theme.id
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTheme(theme.id)}
                  >
                    <p className="font-semibold text-sm mb-1">{theme.name}</p>
                    <div className="flex gap-1">
                      {Object.values(theme.colors).slice(0, 3).map((color, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Builder layouts override theme settings
              </p>
            </div>
          </div>

          {/* Builder Status */}
          {store.useBuilder && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Paintbrush className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">Visual Builder Active</p>
                  <p className="text-xs text-muted-foreground">
                    Your store is using a custom builder layout. Changes to theme will not affect the builder design.
                    Use the Visual Builder to edit your store appearance.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Danger Zone */}
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm mb-1 text-red-900">Danger Zone</p>
                <p className="text-xs text-red-700">
                  Deleting your store is permanent and cannot be undone
                </p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDeleteStore}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Store
              </Button>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSaveChanges}>
              <SettingsIcon className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageStoreDialog;
