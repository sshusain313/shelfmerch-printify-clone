import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BuilderSection } from '@/types/builder';
import { Save, Plus, Trash2 } from 'lucide-react';

interface SectionEditorProps {
  open: boolean;
  onClose: () => void;
  section: BuilderSection | null;
  onSave: (updates: Partial<BuilderSection>) => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({ open, onClose, section, onSave }) => {
  const [settings, setSettings] = useState<any>({});
  const [styles, setStyles] = useState<any>({});

  useEffect(() => {
    if (section) {
      setSettings(section.settings || {});
      setStyles(section.styles || {});
    }
  }, [section]);

  if (!section) return null;

  const handleSave = () => {
    onSave({ settings, styles });
    onClose();
  };

  const updateSetting = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  const updateStyle = (key: string, value: any) => {
    setStyles({ ...styles, [key]: value });
  };

  const updatePadding = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    setStyles({
      ...styles,
      padding: { ...(styles.padding || { top: 32, right: 32, bottom: 32, left: 32 }), [side]: value },
    });
  };

  const addMenuItem = () => {
    const items = settings.menuItems || [];
    items.push({ label: 'New Link', link: '#' });
    updateSetting('menuItems', items);
  };

  const removeMenuItem = (index: number) => {
    const items = [...(settings.menuItems || [])];
    items.splice(index, 1);
    updateSetting('menuItems', items);
  };

  const updateMenuItem = (index: number, field: 'label' | 'link', value: string) => {
    const items = [...(settings.menuItems || [])];
    items[index] = { ...items[index], [field]: value };
    updateSetting('menuItems', items);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {section.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Section</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="content" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-4">
            {/* Header Section */}
            {section.type === 'header' && (
              <>
                <div>
                  <Label>Store Name</Label>
                  <Input
                    value={settings.storeName || ''}
                    onChange={(e) => updateSetting('storeName', e.target.value)}
                    placeholder="My Store"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.showSearch !== false}
                    onCheckedChange={(checked) => updateSetting('showSearch', checked)}
                  />
                  <Label>Show Search</Label>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Menu Items</Label>
                    <Button size="sm" variant="outline" onClick={addMenuItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Link
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(settings.menuItems || []).map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          placeholder="Label"
                          value={item.label}
                          onChange={(e) => updateMenuItem(idx, 'label', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="URL"
                          value={item.link}
                          onChange={(e) => updateMenuItem(idx, 'link', e.target.value)}
                          className="flex-1"
                        />
                        <Button size="icon" variant="ghost" onClick={() => removeMenuItem(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Hero Section */}
            {section.type === 'hero' && (
              <>
                <div>
                  <Label>Heading</Label>
                  <Input
                    value={settings.heading || ''}
                    onChange={(e) => updateSetting('heading', e.target.value)}
                    placeholder="Welcome to Our Store"
                  />
                </div>
                <div>
                  <Label>Subheading</Label>
                  <Textarea
                    value={settings.subheading || ''}
                    onChange={(e) => updateSetting('subheading', e.target.value)}
                    placeholder="Discover amazing products"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Button Text</Label>
                  <Input
                    value={settings.buttonText || ''}
                    onChange={(e) => updateSetting('buttonText', e.target.value)}
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <Label>Button Link</Label>
                  <Input
                    value={settings.buttonLink || ''}
                    onChange={(e) => updateSetting('buttonLink', e.target.value)}
                    placeholder="#products"
                  />
                </div>
                <div>
                  <Label>Alignment</Label>
                  <Select value={settings.alignment || 'center'} onValueChange={(val) => updateSetting('alignment', val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Product Grid Section */}
            {section.type === 'product-grid' && (
              <>
                <div>
                  <Label>Heading</Label>
                  <Input
                    value={settings.heading || ''}
                    onChange={(e) => updateSetting('heading', e.target.value)}
                    placeholder="Featured Products"
                  />
                </div>
                <div>
                  <Label>Columns</Label>
                  <Select value={(settings.columns || 4).toString()} onValueChange={(val) => updateSetting('columns', parseInt(val))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Columns</SelectItem>
                      <SelectItem value="3">3 Columns</SelectItem>
                      <SelectItem value="4">4 Columns</SelectItem>
                      <SelectItem value="5">5 Columns</SelectItem>
                      <SelectItem value="6">6 Columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.showAll !== false}
                      onCheckedChange={(checked) => updateSetting('showAll', checked)}
                    />
                    <Label>Show All Products</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.showPrice !== false}
                      onCheckedChange={(checked) => updateSetting('showPrice', checked)}
                    />
                    <Label>Show Prices</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.showAddToCart !== false}
                      onCheckedChange={(checked) => updateSetting('showAddToCart', checked)}
                    />
                    <Label>Show Add to Cart Button</Label>
                  </div>
                </div>
              </>
            )}

            {/* Text Section */}
            {section.type === 'text' && (
              <>
                <div>
                  <Label>Heading</Label>
                  <Input
                    value={settings.heading || ''}
                    onChange={(e) => updateSetting('heading', e.target.value)}
                    placeholder="About Us"
                  />
                </div>
                <div>
                  <Label>Content (HTML supported)</Label>
                  <Textarea
                    value={settings.content || ''}
                    onChange={(e) => updateSetting('content', e.target.value)}
                    placeholder="<p>Your content here</p>"
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You can use basic HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;
                  </p>
                </div>
                <div>
                  <Label>Alignment</Label>
                  <Select value={settings.alignment || 'left'} onValueChange={(val) => updateSetting('alignment', val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Newsletter Section */}
            {section.type === 'newsletter' && (
              <>
                <div>
                  <Label>Heading</Label>
                  <Input
                    value={settings.heading || ''}
                    onChange={(e) => updateSetting('heading', e.target.value)}
                    placeholder="Stay Updated"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={settings.description || ''}
                    onChange={(e) => updateSetting('description', e.target.value)}
                    placeholder="Subscribe to get special offers"
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Button Text</Label>
                  <Input
                    value={settings.buttonText || ''}
                    onChange={(e) => updateSetting('buttonText', e.target.value)}
                    placeholder="Subscribe"
                  />
                </div>
                <div>
                  <Label>Input Placeholder</Label>
                  <Input
                    value={settings.placeholder || ''}
                    onChange={(e) => updateSetting('placeholder', e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </>
            )}

            {/* Footer Section */}
            {section.type === 'footer' && (
              <>
                <div>
                  <Label>Copyright Text</Label>
                  <Input
                    value={settings.copyright || ''}
                    onChange={(e) => updateSetting('copyright', e.target.value)}
                    placeholder="© 2025 Your Store. All rights reserved."
                  />
                </div>
              </>
            )}

            {/* Generic for other types */}
            {!['header', 'hero', 'product-grid', 'text', 'newsletter', 'footer'].includes(section.type) && (
              <div className="text-sm text-muted-foreground p-4 bg-muted rounded">
                Advanced settings for {section.type} will be available soon.
              </div>
            )}
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-4">
            <div>
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={styles.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={styles.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Padding (px)</Label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Top</Label>
                  <Input
                    type="number"
                    value={styles.padding?.top || 32}
                    onChange={(e) => updatePadding('top', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Right</Label>
                  <Input
                    type="number"
                    value={styles.padding?.right || 32}
                    onChange={(e) => updatePadding('right', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Bottom</Label>
                  <Input
                    type="number"
                    value={styles.padding?.bottom || 32}
                    onChange={(e) => updatePadding('bottom', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Left</Label>
                  <Input
                    type="number"
                    value={styles.padding?.left || 32}
                    onChange={(e) => updatePadding('left', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Text Align</Label>
              <div className="flex gap-2">
                {['left', 'center', 'right'].map((align) => (
                  <Button
                    key={align}
                    size="sm"
                    variant={styles.textAlign === align ? 'default' : 'outline'}
                    onClick={() => updateStyle('textAlign', align)}
                    className="flex-1 capitalize"
                  >
                    {align}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SectionEditor;
