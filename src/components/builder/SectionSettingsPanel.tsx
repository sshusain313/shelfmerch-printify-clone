import React, { useState, useRef } from 'react';
import { BuilderSection } from '@/types/builder';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { uploadApi } from '@/lib/api';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import { CATEGORIES, CategoryId, getSubcategories } from '@/config/productCategories';

interface SectionSettingsPanelProps {
  section: BuilderSection | null;
  onUpdate: (updates: Partial<BuilderSection>) => void;
  onRemove: () => void;
  onDuplicate?: () => void;
}

const SectionSettingsPanel: React.FC<SectionSettingsPanelProps> = ({
  section,
  onUpdate,
  onRemove,
  onDuplicate,
}) => {
  if (!section) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 text-sm text-muted-foreground">
        <p>Select a section on the canvas to customize its content and styling.</p>
        <p className="mt-2">
          You can also click <span className="font-medium">Preview</span> to see how your store looks in different
          devices.
        </p>
      </div>
    );
  }

  const padding = section.styles.padding || { top: 32, right: 32, bottom: 32, left: 32 };
  const margin = section.styles.margin || { top: 0, right: 0, bottom: 0, left: 0 };

  const handleSettingChange = (key: string, value: any) => {
    onUpdate({
      settings: {
        ...section.settings,
        [key]: value,
      },
    });
  };

  const handleStyleChange = (key: string, value: any) => {
    onUpdate({
      styles: {
        ...section.styles,
        [key]: value,
      },
    });
  };

  const handlePaddingChange = (side: keyof typeof padding, value: string) => {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return;

    onUpdate({
      styles: {
        ...section.styles,
        padding: {
          ...padding,
          [side]: numberValue,
        },
      },
    });
  };

  const handleMarginChange = (side: keyof typeof margin, value: string) => {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return;

    onUpdate({
      styles: {
        ...section.styles,
        margin: {
          ...margin,
          [side]: numberValue,
        },
      },
    });
  };

  const renderContentSettings = () => {
    switch (section.type) {
      case 'announcement-bar':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-message">Message</Label>
              <Input
                id="announcement-message"
                value={section.settings.message || ''}
                onChange={(e) => handleSettingChange('message', e.target.value)}
                placeholder="Free shipping on orders over $75"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="announcement-link-label">Link label</Label>
                <Input
                  id="announcement-link-label"
                  value={section.settings.linkLabel || ''}
                  onChange={(e) => handleSettingChange('linkLabel', e.target.value)}
                  placeholder="Shop now"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="announcement-link-url">Link URL</Label>
                <Input
                  id="announcement-link-url"
                  value={section.settings.linkUrl || ''}
                  onChange={(e) => handleSettingChange('linkUrl', e.target.value)}
                  placeholder="/products"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select
                value={section.settings.alignment || 'center'}
                onValueChange={(value) => handleSettingChange('alignment', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">Show close button</span>
              <Switch
                checked={section.settings.showClose ?? true}
                onCheckedChange={(checked) => handleSettingChange('showClose', checked)}
              />
            </div>
          </div>
        );

      case 'hero':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero-heading">Heading</Label>
              <Input
                id="hero-heading"
                value={section.settings.heading || ''}
                onChange={(e) => handleSettingChange('heading', e.target.value)}
                placeholder="Welcome to Our Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-subheading">Subheading</Label>
              <Textarea
                id="hero-subheading"
                value={section.settings.subheading || ''}
                onChange={(e) => handleSettingChange('subheading', e.target.value)}
                placeholder="Share what makes your products special."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hero-button-text">Button Text</Label>
                <Input
                  id="hero-button-text"
                  value={section.settings.buttonText || ''}
                  onChange={(e) => handleSettingChange('buttonText', e.target.value)}
                  placeholder="Shop Now"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-button-link">Button Link</Label>
                <Input
                  id="hero-button-link"
                  value={section.settings.buttonLink || ''}
                  onChange={(e) => handleSettingChange('buttonLink', e.target.value)}
                  placeholder="#products"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content Alignment</Label>
              <Select
                value={section.settings.alignment || 'center'}
                onValueChange={(value) => handleSettingChange('alignment', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero-background-image">Background Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="hero-background-image"
                  value={section.styles.backgroundImage || ''}
                  onChange={(e) => handleStyleChange('backgroundImage', e.target.value)}
                  placeholder="https://example.com/hero.jpg or upload an image"
                  className="flex-1"
                />
                {section.styles.backgroundImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleStyleChange('backgroundImage', '')}
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                      toast.error('Invalid file type', {
                        description: 'Please upload a valid image file',
                      });
                      return;
                    }

                    // Validate file size (max 10MB)
                    const maxSize = 10 * 1024 * 1024; // 10MB
                    if (file.size > maxSize) {
                      toast.error('File too large', {
                        description: 'Image file must be less than 10MB',
                      });
                      return;
                    }

                    try {
                      const imageUrl = await uploadApi.uploadImage(file, 'gallery');
                      handleStyleChange('backgroundImage', imageUrl);
                      toast.success('Image uploaded successfully', {
                        description: 'Background image has been uploaded',
                      });
                    } catch (error) {
                      console.error('Error uploading image:', error);
                      toast.error('Upload failed', {
                        description: error instanceof Error ? error.message : 'Failed to upload image. Please try again.',
                      });
                    } finally {
                      // Reset file input
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                  id="hero-background-image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('hero-background-image-upload')?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Background Image
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave blank to use a solid background color.
              </p>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-heading">Heading</Label>
              <Input
                id="text-heading"
                value={section.settings.heading || ''}
                onChange={(e) => handleSettingChange('heading', e.target.value)}
                placeholder="About Us"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text-content">Content</Label>
              <Textarea
                id="text-content"
                rows={6}
                value={section.settings.content || ''}
                onChange={(e) => handleSettingChange('content', e.target.value)}
                placeholder="<p>Use simple HTML to style your text.</p>"
              />
              <p className="text-xs text-muted-foreground">
                HTML is supported. Use &lt;p&gt;, &lt;strong&gt;, etc.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Text Alignment</Label>
              <Select
                value={section.settings.alignment || 'left'}
                onValueChange={(value) => handleSettingChange('alignment', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select alignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'newsletter':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newsletter-heading">Heading</Label>
              <Input
                id="newsletter-heading"
                value={section.settings.heading || ''}
                onChange={(e) => handleSettingChange('heading', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newsletter-description">Description</Label>
              <Textarea
                id="newsletter-description"
                rows={3}
                value={section.settings.description || ''}
                onChange={(e) => handleSettingChange('description', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newsletter-button-text">Button Text</Label>
                <Input
                  id="newsletter-button-text"
                  value={section.settings.buttonText || ''}
                  onChange={(e) => handleSettingChange('buttonText', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newsletter-placeholder">Input Placeholder</Label>
                <Input
                  id="newsletter-placeholder"
                  value={section.settings.placeholder || ''}
                  onChange={(e) => handleSettingChange('placeholder', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'product-grid':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-grid-heading">Heading</Label>
              <Input
                id="product-grid-heading"
                value={section.settings.heading || ''}
                onChange={(e) => handleSettingChange('heading', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Layout</Label>
              <Select
                value={section.settings.layout || 'grid'}
                onValueChange={(value) => handleSettingChange('layout', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(section.settings.layout || 'grid') === 'grid' && (
              <div className="space-y-2">
                <Label htmlFor="product-grid-columns">Columns</Label>
                <Input
                  id="product-grid-columns"
                  type="number"
                  min={1}
                  max={4}
                  value={section.settings.columns || 4}
                  onChange={(e) => handleSettingChange('columns', Number(e.target.value))}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="product-grid-max">Max Products</Label>
              <Input
                id="product-grid-max"
                type="number"
                min={1}
                max={12}
                value={section.settings.maxProducts || 8}
                onChange={(e) => handleSettingChange('maxProducts', Number(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">Show Pricing</span>
              <Switch
                checked={section.settings.showPrice ?? true}
                onCheckedChange={(checked) => handleSettingChange('showPrice', checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">Show Add to Cart</span>
              <Switch
                checked={section.settings.showAddToCart ?? true}
                onCheckedChange={(checked) => handleSettingChange('showAddToCart', checked)}
              />
            </div>
          </div>
        );

      case 'product-collection': {
        const collections: Array<{ name: string; subcategoryId?: string; categoryId?: string; imageUrl?: string }> = 
          Array.isArray(section.settings.collections) ? section.settings.collections : [];

        const addCollection = () => {
          handleSettingChange('collections', [...collections, { name: '', subcategoryId: '', categoryId: '' }]);
        };

        const updateCollection = (index: number, field: string, value: string) => {
          const updated = [...collections];
          const currentCollection = updated[index] || { name: '', subcategoryId: '', categoryId: '', imageUrl: '' };
          
          // If category is being updated, validate and clear subcategory if invalid
          if (field === 'categoryId') {
            const newCategoryId = value as CategoryId;
            const currentSubcategory = currentCollection.subcategoryId || '';
            
            // If there's a subcategory, check if it's still valid for the new category
            if (currentSubcategory && newCategoryId) {
              const validSubcategories = getSubcategories(newCategoryId);
              if (!validSubcategories.includes(currentSubcategory)) {
                // Clear invalid subcategory
                updated[index] = { ...currentCollection, categoryId: value, subcategoryId: '' };
              } else {
                updated[index] = { ...currentCollection, categoryId: value };
              }
            } else {
              updated[index] = { ...currentCollection, categoryId: value };
            }
          } else {
            updated[index] = { ...currentCollection, [field]: value };
          }
          
          handleSettingChange('collections', updated);
        };

        const removeCollection = (index: number) => {
          handleSettingChange('collections', collections.filter((_, i) => i !== index));
        };

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collection-heading">Heading</Label>
              <Input
                id="collection-heading"
                value={section.settings.heading || ''}
                onChange={(e) => handleSettingChange('heading', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-description">Description</Label>
              <Textarea
                id="collection-description"
                rows={3}
                value={section.settings.description || ''}
                onChange={(e) => handleSettingChange('description', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Layout</Label>
              <Select
                value={section.settings.layout || 'grid'}
                onValueChange={(value) => handleSettingChange('layout', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filter Products By</Label>
              <Select
                value={section.settings.filterBy || 'subcategory'}
                onValueChange={(value) => handleSettingChange('filterBy', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subcategory">Subcategory</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Products Per Collection</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={section.settings.maxProductsPerCollection || 4}
                onChange={(e) => handleSettingChange('maxProductsPerCollection', Number(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">Show Pricing</span>
              <Switch
                checked={section.settings.showPrice ?? true}
                onCheckedChange={(checked) => handleSettingChange('showPrice', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Collections ({collections.length})</Label>
                <Button size="sm" variant="outline" onClick={addCollection}>
                  Add Collection
                </Button>
              </div>

              {collections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded">
                  No collections yet. Add a collection to group products.
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {collections.map((collection, index) => (
                    <div key={index} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Collection {index + 1}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => removeCollection(index)}
                        >
                          ×
                        </Button>
                      </div>
                      <Input
                        value={collection.name}
                        onChange={(e) => updateCollection(index, 'name', e.target.value)}
                        placeholder="Collection name"
                        className="text-sm"
                      />
                      {section.settings.filterBy === 'subcategory' ? (
                        <div className="space-y-2">
                          <Label className="text-xs">Category</Label>
                          <Select
                            value={collection.categoryId || ''}
                            onValueChange={(value) => {
                              // Update category and clear subcategory if it becomes invalid
                              const updated = [...collections];
                              const currentCollection = updated[index] || { name: '', subcategoryId: '', categoryId: '', imageUrl: '' };
                              const currentSubcategory = currentCollection.subcategoryId || '';
                              
                              // Check if current subcategory is valid for new category
                              if (currentSubcategory && value) {
                                const validSubcategories = getSubcategories(value as CategoryId);
                                if (!validSubcategories.includes(currentSubcategory)) {
                                  updated[index] = { ...currentCollection, categoryId: value, subcategoryId: '' };
                                } else {
                                  updated[index] = { ...currentCollection, categoryId: value };
                                }
                              } else {
                                updated[index] = { ...currentCollection, categoryId: value };
                              }
                              handleSettingChange('collections', updated);
                            }}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(CATEGORIES).map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {collection.categoryId && (
                            <>
                              <Label className="text-xs">Subcategory</Label>
                              <Select
                                value={collection.subcategoryId || ''}
                                onValueChange={(value) => updateCollection(index, 'subcategoryId', value)}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue placeholder="Select subcategory" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getSubcategories(collection.categoryId as CategoryId).map((sub) => (
                                    <SelectItem key={sub} value={sub}>
                                      {sub}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-xs">Category</Label>
                          <Select
                            value={collection.categoryId || ''}
                            onValueChange={(value) => updateCollection(index, 'categoryId', value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(CATEGORIES).map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <Input
                        value={collection.imageUrl || ''}
                        onChange={(e) => updateCollection(index, 'imageUrl', e.target.value)}
                        placeholder="Collection image URL (optional)"
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'image': {
        const layout = section.settings.layout || 'single';
        // Normalize images to new structure
        const images: Array<{ url: string; caption?: string }> = Array.isArray(section.settings.images)
          ? section.settings.images.map((img: any) =>
              typeof img === 'string' ? { url: img, caption: '' } : img
            )
          : [];

        const handleLayoutChange = (newLayout: string) => {
          // When switching layouts, preserve/convert images appropriately
          if (newLayout === 'single' && images.length > 1) {
            // Keep only first image when switching to single
            handleSettingChange('images', images.slice(0, 1));
          }
          handleSettingChange('layout', newLayout);
        };

        const handleImageChange = (index: number, field: 'url' | 'caption', value: string) => {
          const updated = [...images];
          if (!updated[index]) {
            updated[index] = { url: '', caption: '' };
          }
          updated[index] = { ...updated[index], [field]: value };
          handleSettingChange('images', updated);
        };

        const handleImageUpload = async (index: number, file: File) => {
          // Validate file type
          if (!file.type.startsWith('image/')) {
            toast.error('Invalid file type', {
              description: 'Please upload a valid image file',
            });
            return;
          }

          // Validate file size (max 10MB)
          const maxSize = 10 * 1024 * 1024; // 10MB
          if (file.size > maxSize) {
            toast.error('File too large', {
              description: 'Image file must be less than 10MB',
            });
            return;
          }

          try {
            const imageUrl = await uploadApi.uploadImage(file, 'gallery');
            handleImageChange(index, 'url', imageUrl);
            toast.success('Image uploaded successfully', {
              description: `Image ${index + 1} has been uploaded`,
            });
          } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Upload failed', {
              description: error instanceof Error ? error.message : 'Failed to upload image. Please try again.',
            });
          }
        };

        const addImage = () => {
          handleSettingChange('images', [...images, { url: '', caption: '' }]);
        };

        const removeImage = (index: number) => {
          handleSettingChange('images', images.filter((_, i) => i !== index));
        };

        const moveImage = (index: number, direction: 'up' | 'down') => {
          const newIndex = direction === 'up' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= images.length) return;
          const updated = [...images];
          [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
          handleSettingChange('images', updated);
        };

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Layout</Label>
              <Select
                value={layout}
                onValueChange={handleLayoutChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {layout === 'grid' && (
              <div className="space-y-2">
                <Label>Grid Columns</Label>
                <Input
                  type="number"
                  min={2}
                  max={4}
                  value={section.settings.gridColumns || 3}
                  onChange={(e) => handleSettingChange('gridColumns', Number(e.target.value))}
                />
              </div>
            )}

            {layout === 'single' ? (
              // Single image mode
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-url">Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="image-url"
                      value={images[0]?.url || ''}
                      onChange={(e) => handleImageChange(0, 'url', e.target.value)}
                      placeholder="https://example.com/featured.jpg or upload an image"
                      className="flex-1"
                    />
                    {images[0]?.url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleImageChange(0, 'url', '')}
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await handleImageUpload(0, file);
                      // Reset file input
                      e.target.value = '';
                    }}
                    className="hidden"
                    id="single-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('single-image-upload')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Caption</Label>
                  <Input
                    value={images[0]?.caption || ''}
                    onChange={(e) => handleImageChange(0, 'caption', e.target.value)}
                    placeholder="Optional caption"
                  />
                </div>
              </div>
            ) : (
              // Multiple images mode (grid/carousel)
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Images ({images.length})</Label>
                  <Button size="sm" variant="outline" onClick={addImage}>
                    Add image
                  </Button>
                </div>
                
                {images.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded">
                    No images yet. Click "Add image" to get started.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {images.map((img, index) => (
                      <div key={index} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Image {index + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => moveImage(index, 'up')}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => moveImage(index, 'down')}
                              disabled={index === images.length - 1}
                            >
                              ↓
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={() => removeImage(index)}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={img.url}
                            onChange={(e) => handleImageChange(index, 'url', e.target.value)}
                            placeholder="Image URL or upload"
                            className="text-sm flex-1"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              await handleImageUpload(index, file);
                              // Reset file input
                              e.target.value = '';
                            }}
                            className="hidden"
                            id={`image-upload-${index}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => document.getElementById(`image-upload-${index}`)?.click()}
                            title="Upload image"
                            className="flex-shrink-0"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          {img.url && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleImageChange(index, 'url', '')}
                              title="Remove image"
                              className="flex-shrink-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Input
                          value={img.caption || ''}
                          onChange={(e) => handleImageChange(index, 'caption', e.target.value)}
                          placeholder="Caption (optional)"
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

    // case 'video': {
    //   const [uploading, setUploading] = useState(false);
    //   const fileInputRef = useRef<HTMLInputElement>(null);

    //   const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = event.target.files?.[0];
    //     if (!file) return;

    //     // Validate file type
    //     const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    //     if (!validVideoTypes.includes(file.type)) {
    //       toast.error('Invalid file type', {
    //         description: 'Please upload a valid video file (MP4, WebM, OGG, MOV, or AVI)',
    //       });
    //       return;
    //     }

    //     // Validate file size (max 100MB)
    //     const maxSize = 100 * 1024 * 1024; // 100MB
    //     if (file.size > maxSize) {
    //       toast.error('File too large', {
    //         description: 'Video file must be less than 100MB',
    //       });
    //       return;
    //     }

    //     setUploading(true);
    //     try {
    //       const videoUrl = await uploadApi.uploadVideo(file, 'videos');
    //       handleSettingChange('videoUrl', videoUrl);
    //       handleSettingChange('provider', 'custom');
    //       toast.success('Video uploaded successfully', {
    //         description: 'Your video has been uploaded and is ready to use',
    //       });
    //     } catch (error) {
    //       console.error('Error uploading video:', error);
    //       toast.error('Upload failed', {
    //         description: error instanceof Error ? error.message : 'Failed to upload video. Please try again.',
    //       });
    //     } finally {
    //       setUploading(false);
    //       // Reset file input
    //       if (fileInputRef.current) {
    //         fileInputRef.current.value = '';
    //       }
    //     }
    //   };

    //   const handleRemoveVideo = () => {
    //     handleSettingChange('videoUrl', '');
    //     if (fileInputRef.current) {
    //       fileInputRef.current.value = '';
    //     }
    //   };

    //   return (
    //     <div className="space-y-4">
    //       <div className="space-y-2">
    //         <Label htmlFor="video-url">Video URL</Label>
    //         <div className="flex gap-2">
    //           <Input
    //             id="video-url"
    //             value={section.settings.videoUrl || ''}
    //             onChange={(e) => handleSettingChange('videoUrl', e.target.value)}
    //             placeholder="https://www.youtube.com/watch?v=... or upload a video file"
    //             className="flex-1"
    //           />
    //           {section.settings.videoUrl && (
    //             <Button
    //               type="button"
    //               variant="outline"
    //               size="icon"
    //               onClick={handleRemoveVideo}
    //               title="Remove video"
    //             >
    //               <X className="h-4 w-4" />
    //             </Button>
    //           )}
    //         </div>
    //       </div>

    //       <div className="space-y-2">
    //         <Label>Upload Video from Device</Label>
    //         <div className="flex flex-col gap-2">
    //           <input
    //             ref={fileInputRef}
    //             type="file"
    //             accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
    //             onChange={handleVideoUpload}
    //             className="hidden"
    //             id="video-file-input"
    //             disabled={uploading}
    //           />
    //           <Button
    //             type="button"
    //             variant="outline"
    //             onClick={() => fileInputRef.current?.click()}
    //             disabled={uploading}
    //             className="w-full"
    //           >
    //             <Upload className="h-4 w-4 mr-2" />
    //             {uploading ? 'Uploading...' : 'Choose Video File'}
    //           </Button>
    //           <p className="text-xs text-muted-foreground">
    //             Supported formats: MP4, WebM, OGG, MOV, AVI (max 100MB)
    //           </p>
    //         </div>
    //       </div>

    //       <Separator />

    //       <div className="grid grid-cols-2 gap-4">
    //         <div className="space-y-2">
    //           <Label>Provider</Label>
    //           <Select
    //             value={section.settings.provider || 'youtube'}
    //             onValueChange={(value) => handleSettingChange('provider', value)}
    //           >
    //             <SelectTrigger>
    //               <SelectValue placeholder="Select provider" />
    //             </SelectTrigger>
    //             <SelectContent>
    //               <SelectItem value="youtube">YouTube</SelectItem>
    //               <SelectItem value="vimeo">Vimeo</SelectItem>
    //               <SelectItem value="custom">Custom / Uploaded</SelectItem>
    //             </SelectContent>
    //           </Select>
    //         </div>
    //         <div className="space-y-2">
    //           <Label>Autoplay</Label>
    //           <Switch
    //             checked={section.settings.autoplay ?? false}
    //             onCheckedChange={(checked) => handleSettingChange('autoplay', checked)}
    //           />
    //         </div>
    //       </div>
    //       <div className="grid grid-cols-2 gap-4">
    //         <div className="space-y-2">
    //           <Label>Controls</Label>
    //           <Switch
    //             checked={section.settings.controls ?? true}
    //             onCheckedChange={(checked) => handleSettingChange('controls', checked)}
    //           />
    //         </div>
    //         <div className="space-y-2">
    //           <Label htmlFor="video-aspect">Aspect ratio</Label>
    //           <Input
    //             id="video-aspect"
    //             value={section.settings.aspectRatio || '16:9'}
    //             onChange={(e) => handleSettingChange('aspectRatio', e.target.value)}
    //             placeholder="16:9"
    //           />
    //         </div>
    //       </div>
    //     </div>
    //   );
    // }

    case 'product-details': {
        const trustBadges: Array<{ icon?: string; title?: string; text?: string }> = Array.isArray(
          section.settings.trustBadges,
        )
          ? [...section.settings.trustBadges]
          : [];
        while (trustBadges.length < 2) {
          trustBadges.push({ icon: 'Truck', title: '', text: '' });
        }

        const updateTrustBadge = (index: number, key: string, value: string) => {
          const updated = [...trustBadges];
          updated[index] = {
            ...(updated[index] || {}),
            [key]: value,
          };
          handleSettingChange('trustBadges', updated);
        };

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">Show badge</span>
              <Switch
                checked={section.settings.showBadge ?? true}
                onCheckedChange={(checked) => handleSettingChange('showBadge', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-details-badge">Badge text</Label>
              <Input
                id="product-details-badge"
                value={section.settings.badgeText || ''}
                onChange={(e) => handleSettingChange('badgeText', e.target.value)}
                placeholder="Bestseller"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-details-tagline">Tagline</Label>
              <Input
                id="product-details-tagline"
                value={section.settings.tagline || ''}
                onChange={(e) => handleSettingChange('tagline', e.target.value)}
                placeholder="Premium quality you can feel"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">Show rating</span>
              <Switch
                checked={section.settings.showRating ?? true}
                onCheckedChange={(checked) => handleSettingChange('showRating', checked)}
              />
            </div>
            {section.settings.showRating !== false && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-details-rating-value">Rating value</Label>
                  <Input
                    id="product-details-rating-value"
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={section.settings.ratingValue ?? 4.8}
                    onChange={(e) => handleSettingChange('ratingValue', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-details-rating-count">Rating count</Label>
                  <Input
                    id="product-details-rating-count"
                    type="number"
                    min={0}
                    value={section.settings.ratingCount ?? 120}
                    onChange={(e) => handleSettingChange('ratingCount', Number(e.target.value))}
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">Show trust badges</span>
              <Switch
                checked={section.settings.showTrustBadges ?? true}
                onCheckedChange={(checked) => handleSettingChange('showTrustBadges', checked)}
              />
            </div>
            {section.settings.showTrustBadges !== false && (
              <div className="space-y-4">
                {trustBadges.slice(0, 2).map((badge, index) => (
                  <div key={index} className="rounded-lg border p-4 space-y-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Badge {index + 1}
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor={`badge-title-${index}`}>Title</Label>
                      <Input
                        id={`badge-title-${index}`}
                        value={badge.title || ''}
                        onChange={(e) => updateTrustBadge(index, 'title', e.target.value)}
                        placeholder="Fast fulfillment"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`badge-text-${index}`}>Description</Label>
                      <Input
                        id={`badge-text-${index}`}
                        value={badge.text || ''}
                        onChange={(e) => updateTrustBadge(index, 'text', e.target.value)}
                        placeholder="Ships in 2-3 business days"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">Show reviews</span>
              <Switch
                checked={section.settings.showReviews ?? true}
                onCheckedChange={(checked) => handleSettingChange('showReviews', checked)}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">Show size chart</span>
              <Switch
                checked={section.settings.showSizeChart ?? true}
                onCheckedChange={(checked) => handleSettingChange('showSizeChart', checked)}
              />
            </div>
          </div>
        );
      }

      case 'product-recommendations':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recommendations-heading">Heading</Label>
              <Input
                id="recommendations-heading"
                value={section.settings.heading || ''}
                onChange={(e) => handleSettingChange('heading', e.target.value)}
                placeholder="You may also like"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendations-subheading">Subheading</Label>
              <Textarea
                id="recommendations-subheading"
                rows={3}
                value={section.settings.subheading || ''}
                onChange={(e) => handleSettingChange('subheading', e.target.value)}
                placeholder="Suggest complementary items or bundles."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recommendations-max-items">Products to show</Label>
                <Input
                  id="recommendations-max-items"
                  type="number"
                  min={1}
                  max={8}
                  value={section.settings.maxItems || 4}
                  onChange={(e) => handleSettingChange('maxItems', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Layout</Label>
                <Select
                  value={section.settings.layout || 'grid'}
                  onValueChange={(value) => handleSettingChange('layout', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'testimonials':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testimonials-heading">Heading</Label>
              <Input
                id="testimonials-heading"
                value={section.settings.heading || ''}
                onChange={(e) => handleSettingChange('heading', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Layout</Label>
              <Select
                value={section.settings.layout || 'carousel'}
                onValueChange={(value) => handleSettingChange('layout', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Editing testimonial entries will be available soon.
            </p>
          </div>
        );

      case 'header':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="header-store-name">Store Name</Label>
              <Input
                id="header-store-name"
                value={section.settings.storeName || ''}
                onChange={(e) => handleSettingChange('storeName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Show Search</Label>
              <Switch
                checked={section.settings.showSearch ?? true}
                onCheckedChange={(checked) => handleSettingChange('showSearch', checked)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Navigation menu editing will be available in a future update.
            </p>
          </div>
        );

      case 'footer':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="footer-text">Footer Text</Label>
              <Textarea
                id="footer-text"
                rows={3}
                value={section.settings.copyright || ''}
                onChange={(e) => handleSettingChange('copyright', e.target.value)}
              />
            </div>
          </div>
        );

      case 'custom-html':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-html">HTML Content</Label>
              <Textarea
                id="custom-html"
                rows={8}
                value={section.settings.html || ''}
                onChange={(e) => handleSettingChange('html', e.target.value)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Editing</p>
          <h2 className="text-lg font-semibold capitalize">{section.type.replace('-', ' ')}</h2>
        </div>
        <div className="flex items-center gap-2">
          {onDuplicate && (
            <Button size="sm" variant="outline" onClick={onDuplicate}>
              Duplicate
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Visibility</h3>
            <Switch
              checked={section.visible}
              onCheckedChange={(checked) => onUpdate({ visible: checked })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Hidden sections will not appear on your published store, but you can keep editing them
            here.
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-medium">Content</h3>
          {renderContentSettings() || (
            <p className="text-xs text-muted-foreground">
              This section type does not have editable content yet.
            </p>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Layout & Styles</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  className={cn(
                    'h-10 w-10 cursor-pointer rounded-md border border-input bg-background p-1'
                  )}
                  value={section.styles.backgroundColor || '#ffffff'}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                />
                <Input
                  value={section.styles.backgroundColor || '#ffffff'}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Text Align</Label>
              <Select
                value={section.styles.textAlign || section.settings.alignment || 'left'}
                onValueChange={(value) => handleStyleChange('textAlign', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select align" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Width</Label>
              <Input
                value={section.styles.maxWidth || '100%'}
                onChange={(e) => handleStyleChange('maxWidth', e.target.value)}
                placeholder="e.g. 1100px or 100%"
              />
            </div>
            <div className="space-y-2">
              <Label>Border Radius</Label>
              <Input
                value={section.styles.borderRadius || ''}
                onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                placeholder="e.g. 16px"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Padding
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Top</Label>
                <Input
                  type="number"
                  value={padding.top}
                  onChange={(e) => handlePaddingChange('top', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bottom</Label>
                <Input
                  type="number"
                  value={padding.bottom}
                  onChange={(e) => handlePaddingChange('bottom', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Left</Label>
                <Input
                  type="number"
                  value={padding.left}
                  onChange={(e) => handlePaddingChange('left', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Right</Label>
                <Input
                  type="number"
                  value={padding.right}
                  onChange={(e) => handlePaddingChange('right', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Margin
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Top</Label>
                <Input
                  type="number"
                  value={margin.top}
                  onChange={(e) => handleMarginChange('top', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bottom</Label>
                <Input
                  type="number"
                  value={margin.bottom}
                  onChange={(e) => handleMarginChange('bottom', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Left</Label>
                <Input
                  type="number"
                  value={margin.left}
                  onChange={(e) => handleMarginChange('left', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Right</Label>
                <Input
                  type="number"
                  value={margin.right}
                  onChange={(e) => handleMarginChange('right', e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SectionSettingsPanel;


