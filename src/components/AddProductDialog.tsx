import { useState, useRef } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Product } from '@/types';
import { categories } from '@/data/products';

interface AddProductDialogProps {
  onProductAdded: (product: Product) => void;
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'One Size'];
const AVAILABLE_COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Gray', hex: '#9CA3AF' },
  { name: 'Navy', hex: '#1E3A8A' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Purple', hex: '#9333EA' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Brown', hex: '#92400E' },
];

export const AddProductDialog = ({ onProductAdded }: AddProductDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    category: '',
    price: '',
    compareAtPrice: '',
  });
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [mockupImages, setMockupImages] = useState<string[]>([]);
  const [frontDesign, setFrontDesign] = useState<string>('');
  const [backDesign, setBackDesign] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const frontDesignInputRef = useRef<HTMLInputElement>(null);
  const backDesignInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const handleImageUpload = async (files: FileList | null, type: 'mockup' | 'front' | 'back') => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      if (type === 'mockup') {
        setMockupImages(prev => [...prev, dataUrl]);
      } else if (type === 'front') {
        setFrontDesign(dataUrl);
      } else if (type === 'back') {
        setBackDesign(dataUrl);
      }
    };

    reader.readAsDataURL(file);
  };

  const removeMockupImage = (index: number) => {
    setMockupImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (selectedSizes.length === 0) {
      toast.error('Please select at least one size');
      return;
    }
    if (selectedColors.length === 0) {
      toast.error('Please select at least one color');
      return;
    }
    if (mockupImages.length === 0) {
      toast.error('Please upload at least one mockup image');
      return;
    }

    // Create new product
    const newProduct: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: 'admin',
      name: formData.name,
      description: formData.description,
      baseProduct: formData.category,
      price: parseFloat(formData.price),
      compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
      mockupUrl: mockupImages[0],
      mockupUrls: mockupImages,
      designs: {
        front: frontDesign || undefined,
        back: backDesign || undefined,
      },
      variants: {
        colors: selectedColors,
        sizes: selectedSizes,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    const allProducts = JSON.parse(localStorage.getItem('shelfmerch_all_products') || '[]');
    allProducts.push(newProduct);
    localStorage.setItem('shelfmerch_all_products', JSON.stringify(allProducts));

    onProductAdded(newProduct);
    toast.success('Product added successfully');
    
    // Reset form
    setFormData({
      name: '',
      brand: '',
      description: '',
      category: '',
      price: '',
      compareAtPrice: '',
    });
    setSelectedSizes([]);
    setSelectedColors([]);
    setMockupImages([]);
    setFrontDesign('');
    setBackDesign('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Base Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product to Catalog</DialogTitle>
          <DialogDescription>
            Create a new base product that merchants can customize and sell in their stores
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Bella Canvas 3001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="e.g., Bella + Canvas"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the product features, materials, and quality..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Base Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare at Price (USD)</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.compareAtPrice}
                  onChange={(e) => handleInputChange('compareAtPrice', e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Sizes *</h3>
            <div className="grid grid-cols-4 gap-3">
              {AVAILABLE_SIZES.map((size) => (
                <label
                  key={size}
                  className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <Checkbox
                    checked={selectedSizes.includes(size)}
                    onCheckedChange={() => handleSizeToggle(size)}
                  />
                  <span className="text-sm font-medium">{size}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Available Colors *</h3>
            <div className="grid grid-cols-4 gap-3">
              {AVAILABLE_COLORS.map((color) => (
                <label
                  key={color.name}
                  className="flex items-center space-x-2 cursor-pointer p-3 rounded-lg border hover:bg-muted transition-colors"
                >
                  <Checkbox
                    checked={selectedColors.includes(color.name)}
                    onCheckedChange={() => handleColorToggle(color.name)}
                  />
                  <div
                    className="w-6 h-6 rounded-full border-2"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-sm font-medium">{color.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Mockup Images */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Mockup Images *</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files, 'mockup')}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              {mockupImages.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg border overflow-hidden group">
                  <img src={image} alt={`Mockup ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeMockupImage(index)}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {mockupImages.length === 0 && (
                <div className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No images</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Design Areas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Design Areas (Optional)</h3>
            <p className="text-sm text-muted-foreground">
              Upload template images showing where designs can be placed
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Front Design Area</Label>
                <div
                  onClick={() => frontDesignInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden"
                >
                  {frontDesign ? (
                    <img src={frontDesign} alt="Front design" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Click to upload</p>
                    </div>
                  )}
                </div>
                <input
                  ref={frontDesignInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files, 'front')}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <Label>Back Design Area</Label>
                <div
                  onClick={() => backDesignInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden"
                >
                  {backDesign ? (
                    <img src={backDesign} alt="Back design" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Click to upload</p>
                    </div>
                  )}
                </div>
                <input
                  ref={backDesignInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files, 'back')}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Product to Catalog
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
