import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Square, 
  Circle, 
  Triangle, 
  Hexagon, 
  Star, 
  Pentagon,
  Grid3x3,
  RotateCw,
  RotateCcw,
  Info,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

type PlaceholderShape = 'rectangle' | 'circle' | 'triangle' | 'hexagon' | 'star' | 'pentagon' | 'custom';
type ViewMode = 'front' | 'back' | 'side';

const AdminProductCreation = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Image and mockup state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [hasTransparency, setHasTransparency] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [placeholderShape, setPlaceholderShape] = useState<PlaceholderShape>('rectangle');
  const [viewMode, setViewMode] = useState<ViewMode>('front');
  const [rotation, setRotation] = useState(0);
  const [hideAreas, setHideAreas] = useState(false);
  const [magneticCanvas, setMagneticCanvas] = useState(false);
  
  // Color variants
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('#000000');
  const [colorNameInput, setColorNameInput] = useState('');

  const subcategoryOptions = [
    'T-Shirts', 'Hoodies', 'Sweatshirts', 'Tank Tops', 'Long Sleeves',
    'Mugs', 'Phone Cases', 'Tote Bags', 'Posters', 'Stickers'
  ];

  const commonColors = [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Navy', hex: '#001F3F' },
    { name: 'Red', hex: '#FF4136' },
    { name: 'Blue', hex: '#0074D9' },
    { name: 'Green', hex: '#2ECC40' },
    { name: 'Yellow', hex: '#FFDC00' },
    { name: 'Orange', hex: '#FF851B' },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUploadedImage(event.target?.result as string);
        setImageSize({ width: img.width, height: img.height });
        
        // Check for transparency (simplified check)
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const hasAlpha = imageData.data.some((_, i) => i % 4 === 3 && imageData.data[i] < 255);
          setHasTransparency(hasAlpha);
        }
        
        toast.success('Image uploaded successfully');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setHasTransparency(false);
    setImageSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddColor = () => {
    const colorData = `${colorNameInput}:${colorInput}`;
    if (colorNameInput.trim() && colorInput && !selectedColors.includes(colorData)) {
      setSelectedColors([...selectedColors, colorData]);
      setColorInput('#000000');
      setColorNameInput('');
    }
  };

  const handleAddCommonColor = (color: { name: string; hex: string }) => {
    const colorData = `${color.name}:${color.hex}`;
    if (!selectedColors.includes(colorData)) {
      setSelectedColors([...selectedColors, colorData]);
    }
  };

  const handleRemoveColor = (color: string) => {
    setSelectedColors(selectedColors.filter(c => c !== color));
  };

  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const handleResetRotation = () => {
    setRotation(0);
  };

  const handleCreateProduct = () => {
    if (!productName || !description || !category || price === '') {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!uploadedImage) {
      toast.error('Please upload a product image');
      return;
    }

    // Here you would typically save to your backend/database
    toast.success('Product created successfully!');
    navigate('/admin');
  };

  const shapeIcons = {
    rectangle: Square,
    circle: Circle,
    triangle: Triangle,
    hexagon: Hexagon,
    star: Star,
    pentagon: Pentagon,
    custom: Grid3x3,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Products
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/admin')}>
                Admin User
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Add New Product</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Product Details */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Product Name */}
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    placeholder="Enter product name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter product description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apparel">Apparel</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                      <SelectItem value="home">Home & Living</SelectItem>
                      <SelectItem value="art">Art Prints</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subcategories */}
                <div className="space-y-2">
                  <Label>Subcategories</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!subcategories.includes(value)) {
                        setSubcategories([...subcategories, value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategories" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategoryOptions.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {subcategories.map((sub) => (
                        <Badge key={sub} variant="secondary" className="gap-1">
                          {sub}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => setSubcategories(subcategories.filter(s => s !== sub))}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Product Tags & Attributes */}
                <div className="space-y-2">
                  <Label>
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span>Product Tags & Attributes</span>
                    </div>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button onClick={handleAddTag} size="sm">
                      Add
                    </Button>
                  </div>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (!tags.includes(value)) {
                        setTags([...tags, value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select from common tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cotton">Cotton</SelectItem>
                      <SelectItem value="Polyester">Polyester</SelectItem>
                      <SelectItem value="Unisex">Unisex</SelectItem>
                      <SelectItem value="Eco-Friendly">Eco-Friendly</SelectItem>
                      <SelectItem value="Limited Edition">Limited Edition</SelectItem>
                    </SelectContent>
                  </Select>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="gap-1">
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  {tags.length === 0 && (
                    <p className="text-xs text-muted-foreground">No tags selected</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Product Image & Mockup */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Product Image</Label>
                  {!uploadedImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </Button>
                  )}
                  {uploadedImage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2 text-primary"
                    >
                      Create Mockup
                    </Button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Image Upload Area */}
                <div className="border-2 border-dashed border-border rounded-lg p-8 min-h-[400px] flex items-center justify-center bg-muted/20">
                  {!uploadedImage ? (
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Drag and drop your image here, or click to browse
                        </p>
                        <Button
                          variant="link"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2"
                        >
                          Browse Files
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full space-y-4">
                      <div className="relative bg-white rounded-lg p-4 flex items-center justify-center min-h-[300px]">
                        <img
                          src={uploadedImage}
                          alt="Product"
                          style={{ 
                            transform: `rotate(${rotation}deg)`,
                            maxWidth: '100%',
                            maxHeight: '300px',
                            objectFit: 'contain'
                          }}
                          className="transition-transform duration-200"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* File Info */}
                      {imageSize && (
                        <p className="text-xs text-center text-muted-foreground">
                          {uploadedImage.split('/').pop()?.split(';')[0].split(',')[0]} • {imageSize.width} × {imageSize.height} px
                        </p>
                      )}

                      {/* Success Message */}
                      {hasTransparency && (
                        <Alert className="bg-primary/5 border-primary/20">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <AlertDescription className="text-primary">
                            <p className="font-medium">Perfect! Transparency Detected</p>
                            <p className="text-xs mt-1 text-muted-foreground">
                              Your PNG has a transparent background, which is ideal for product mockups.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              You can proceed to the "Create Mockup" tab to see your design on the product.
                            </p>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Image Requirements */}
                      <div className="bg-accent/50 rounded-lg p-4 space-y-2">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p className="font-medium text-foreground">Image Requirements:</p>
                            <ul className="space-y-1 list-disc list-inside">
                              <li>Format: PNG files only (png extension)</li>
                              <li>Size: Maximum 15MB</li>
                              <li>
                                Transparency: Must support transparency which is ideal for product mockups
                              </li>
                              <li>Resolution: Recommended minimum 3000×4000 pixels for best quality</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mockup Controls */}
                {uploadedImage && (
                  <>
                    <Separator />
                    
                    {/* Placeholder Shape */}
                    <div className="space-y-2">
                      <Label>Placeholder Shape</Label>
                      <div className="grid grid-cols-7 gap-2">
                        {(Object.keys(shapeIcons) as PlaceholderShape[]).map((shape) => {
                          const Icon = shapeIcons[shape];
                          return (
                            <Button
                              key={shape}
                              variant={placeholderShape === shape ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPlaceholderShape(shape)}
                              className="flex flex-col items-center gap-1 h-auto py-2 px-1"
                            >
                              <Icon className="h-4 w-4" />
                              <span className="text-[10px] capitalize truncate w-full text-center">
                                {shape === 'custom' ? 'Cstm' : shape.substring(0, 4)}
                              </span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {/* View Mode */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          variant={viewMode === 'front' ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode('front')}
                          className="flex-1"
                        >
                          Front View
                        </Button>
                        <Button
                          variant={viewMode === 'back' ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode('back')}
                          className="flex-1"
                        >
                          Back View
                        </Button>
                        <Button
                          variant={viewMode === 'side' ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode('side')}
                          className="flex-1"
                        >
                          Side View
                        </Button>
                      </div>
                    </div>

                    {/* Toggle Controls */}
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="hideAreas"
                          checked={hideAreas}
                          onCheckedChange={setHideAreas}
                        />
                        <Label htmlFor="hideAreas" className="text-sm flex items-center gap-1 cursor-pointer">
                          {hideAreas ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          Hide Areas
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="magneticCanvas"
                          checked={magneticCanvas}
                          onCheckedChange={setMagneticCanvas}
                        />
                        <Label htmlFor="magneticCanvas" className="text-sm flex items-center gap-1 cursor-pointer">
                          <Grid3x3 className="h-4 w-4" />
                          Magnetic Canvas
                        </Label>
                      </div>
                    </div>

                    {/* Rotation Controls */}
                    <div className="space-y-2">
                      <Label>Rotation</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRotate(-90)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          -90°
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRotate(90)}
                        >
                          <RotateCw className="h-4 w-4 mr-1" />
                          +90°
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRotation(0)}
                        >
                          0°
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRotation(180)}
                        >
                          ±180°
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetRotation}
                        >
                          Reset
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Current rotation: {rotation}°
                      </p>
                    </div>

                    <Separator />

                    {/* Color Variants Preview */}
                    <div className="space-y-2">
                      <Label>Color Variants Preview</Label>
                      <div className="bg-muted/30 rounded-lg p-4 text-center text-sm text-muted-foreground">
                        {selectedColors.length > 0 ? (
                          <div className="flex flex-wrap gap-3 justify-center">
                            {selectedColors.map((color) => {
                              const [name, hex] = color.split(':');
                              return (
                                <div key={color} className="text-center">
                                  <div
                                    className="w-12 h-12 rounded-md border-2 border-border mb-1 shadow-sm"
                                    style={{ backgroundColor: hex }}
                                  />
                                  <p className="text-xs">{name}</p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          'No color variants selected'
                        )}
                      </div>
                    </div>

                    {/* Product Colors */}
                    <div className="space-y-2">
                      <Label>
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span>Product Colors</span>
                        </div>
                      </Label>
                      <div className="flex gap-2">
                        <div className="w-10 h-10 rounded border overflow-hidden flex-shrink-0">
                          <input
                            type="color"
                            value={colorInput}
                            onChange={(e) => setColorInput(e.target.value)}
                            className="w-full h-full cursor-pointer"
                          />
                        </div>
                        <Input
                          placeholder="Color name (e.g., Baby Red)"
                          value={colorNameInput}
                          onChange={(e) => setColorNameInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddColor()}
                          className="flex-1"
                        />
                        <Button onClick={handleAddColor} size="sm">
                          Add
                        </Button>
                      </div>
                      <Select
                        value=""
                        onValueChange={(value) => {
                          const color = commonColors.find(c => c.name === value);
                          if (color) handleAddCommonColor(color);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select from common colors" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonColors.map((color) => (
                            <SelectItem key={color.name} value={color.name}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: color.hex }}
                                />
                                {color.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedColors.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedColors.map((color) => {
                            const [name, hex] = color.split(':');
                            return (
                              <Badge key={color} variant="outline" className="gap-2">
                                <div
                                  className="w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: hex }}
                                />
                                {name}
                                <X
                                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                                  onClick={() => handleRemoveColor(color)}
                                />
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      {selectedColors.length === 0 && (
                        <p className="text-xs text-muted-foreground">No colors selected</p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Product Button */}
        <div className="flex justify-end mt-6">
          <Button
            size="lg"
            onClick={handleCreateProduct}
            className="min-w-[200px]"
          >
            Create Product
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminProductCreation;
