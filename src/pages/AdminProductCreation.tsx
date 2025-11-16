import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X, Move, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BoundaryEditorProps {
  imageUrl: string;
  boundary: { x: number; y: number; width: number; height: number } | null;
  onBoundaryChange: (boundary: { x: number; y: number; width: number; height: number } | null) => void;
  onClose: () => void;
}

const BoundaryEditor = ({ imageUrl, boundary, onBoundaryChange, onClose }: BoundaryEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBoundary, setCurrentBoundary] = useState<{ x: number; y: number; width: number; height: number } | null>(boundary);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setCurrentBoundary(boundary);
  }, [boundary]);

  const getRelativePosition = (e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const pos = getRelativePosition(e);
    
    // Check if clicking on existing boundary
    if (currentBoundary) {
      const { x, y, width, height } = currentBoundary;
      if (pos.x >= x && pos.x <= x + width && pos.y >= y && pos.y <= y + height) {
        // Check if clicking on resize handle
        const handleSize = 8;
        const handles = [
          { name: 'nw', x: x, y: y },
          { name: 'ne', x: x + width, y: y },
          { name: 'sw', x: x, y: y + height },
          { name: 'se', x: x + width, y: y + height },
        ];
        
        for (const handle of handles) {
          if (Math.abs(pos.x - handle.x) < handleSize && Math.abs(pos.y - handle.y) < handleSize) {
            setIsResizing(true);
            setResizeHandle(handle.name);
            setDragStart({ x: handle.x, y: handle.y });
            return;
          }
        }
        
        // Dragging the boundary
        setIsDragging(true);
        setDragStart({ x: pos.x - x, y: pos.y - y });
        return;
      }
    }
    
    // Start drawing new boundary
    setIsDrawing(true);
    setStartPos(pos);
    setCurrentBoundary({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return;
    const pos = getRelativePosition(e);
    
    // Update hover position for cursor feedback
    if (!isDrawing && !isDragging && !isResizing) {
      setHoverPos(pos);
    }

    if (isDrawing && startPos) {
      const x = Math.min(startPos.x, pos.x);
      const y = Math.min(startPos.y, pos.y);
      const width = Math.abs(pos.x - startPos.x);
      const height = Math.abs(pos.y - startPos.y);
      setCurrentBoundary({ x, y, width, height });
    } else if (isDragging && currentBoundary && dragStart) {
      const newX = Math.max(0, Math.min(100 - currentBoundary.width, pos.x - dragStart.x));
      const newY = Math.max(0, Math.min(100 - currentBoundary.height, pos.y - dragStart.y));
      setCurrentBoundary({ ...currentBoundary, x: newX, y: newY });
    } else if (isResizing && currentBoundary && dragStart && resizeHandle) {
      let newBoundary = { ...currentBoundary };
      
      switch (resizeHandle) {
        case 'nw':
          newBoundary.width = currentBoundary.x + currentBoundary.width - pos.x;
          newBoundary.height = currentBoundary.y + currentBoundary.height - pos.y;
          newBoundary.x = Math.max(0, pos.x);
          newBoundary.y = Math.max(0, pos.y);
          break;
        case 'ne':
          newBoundary.width = pos.x - currentBoundary.x;
          newBoundary.height = currentBoundary.y + currentBoundary.height - pos.y;
          newBoundary.y = Math.max(0, pos.y);
          newBoundary.width = Math.min(100 - newBoundary.x, newBoundary.width);
          break;
        case 'sw':
          newBoundary.width = currentBoundary.x + currentBoundary.width - pos.x;
          newBoundary.height = pos.y - currentBoundary.y;
          newBoundary.x = Math.max(0, pos.x);
          newBoundary.height = Math.min(100 - newBoundary.y, newBoundary.height);
          break;
        case 'se':
          newBoundary.width = pos.x - currentBoundary.x;
          newBoundary.height = pos.y - currentBoundary.y;
          newBoundary.width = Math.min(100 - newBoundary.x, newBoundary.width);
          newBoundary.height = Math.min(100 - newBoundary.y, newBoundary.height);
          break;
      }
      
      if (newBoundary.width > 0 && newBoundary.height > 0) {
        setCurrentBoundary(newBoundary);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setStartPos(null);
    setDragStart(null);
  };

  useEffect(() => {
    if (isDrawing || isDragging || isResizing) {
      const handleMove = (e: MouseEvent) => handleMouseMove(e);
      const handleUp = () => handleMouseUp();
      
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
    }
  }, [isDrawing, isDragging, isResizing, startPos, dragStart, currentBoundary, resizeHandle]);

  const handleSave = () => {
    onBoundaryChange(currentBoundary);
    onClose();
  };

  const handleClear = () => {
    setCurrentBoundary(null);
    onBoundaryChange(null);
  };

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative w-full bg-muted rounded-lg overflow-hidden cursor-crosshair"
        style={{ aspectRatio: '1', maxHeight: '600px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverPos(null)}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Design area"
          className="w-full h-full object-contain"
          draggable={false}
        />
        {currentBoundary && (
          <>
            <div
              className={`absolute border-2 border-dashed shadow-lg bg-white/10 transition-all ${
                hoverPos && 
                hoverPos.x >= currentBoundary.x && 
                hoverPos.x <= currentBoundary.x + currentBoundary.width &&
                hoverPos.y >= currentBoundary.y && 
                hoverPos.y <= currentBoundary.y + currentBoundary.height &&
                !isDrawing && !isDragging && !isResizing
                  ? 'border-blue-400 bg-blue-400/20 cursor-move'
                  : 'border-white'
              }`}
              style={{
                left: `${currentBoundary.x}%`,
                top: `${currentBoundary.y}%`,
                width: `${currentBoundary.width}%`,
                height: `${currentBoundary.height}%`,
                pointerEvents: 'none',
              }}
            />
            {/* Resize handles */}
            {['nw', 'ne', 'sw', 'se'].map((handle) => {
              const positions: Record<string, { left: string; top: string }> = {
                nw: { left: `${currentBoundary.x}%`, top: `${currentBoundary.y}%` },
                ne: { left: `${currentBoundary.x + currentBoundary.width}%`, top: `${currentBoundary.y}%` },
                sw: { left: `${currentBoundary.x}%`, top: `${currentBoundary.y + currentBoundary.height}%` },
                se: { left: `${currentBoundary.x + currentBoundary.width}%`, top: `${currentBoundary.y + currentBoundary.height}%` },
              };
              return (
                <div
                  key={handle}
                  className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full cursor-nwse-resize transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{
                    ...positions[handle],
                    pointerEvents: 'auto',
                    cursor: handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize',
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsResizing(true);
                    setResizeHandle(handle);
                    const pos = getRelativePosition(e);
                    setDragStart({ x: pos.x, y: pos.y });
                  }}
                />
              );
            })}
          </>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {currentBoundary
            ? `Boundary: ${currentBoundary.width.toFixed(1)}% × ${currentBoundary.height.toFixed(1)}%`
            : 'Click and drag to draw a boundary'}
        </div>
        <div className="flex gap-2">
          {currentBoundary && (
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          )}
          <Button onClick={handleSave}>Save Boundary</Button>
        </div>
      </div>
    </div>
  );
};

const AdminProductCreation = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'L', 'XL']);
  const [selectedColors, setSelectedColors] = useState<string[]>(['Black', 'White']);
  const [mockupImages, setMockupImages] = useState<string[]>([]);
  const [designAreaFront, setDesignAreaFront] = useState('');
  const [designAreaBack, setDesignAreaBack] = useState('');
  const [frontBoundary, setFrontBoundary] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [backBoundary, setBackBoundary] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isEditingFront, setIsEditingFront] = useState(false);
  const [isEditingBack, setIsEditingBack] = useState(false);
  const mockupInputRef = useRef<HTMLInputElement>(null);
  const frontDesignRef = useRef<HTMLInputElement>(null);
  const backDesignRef = useRef<HTMLInputElement>(null);

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];
  const availableColors = ['Black', 'White', 'Navy', 'Gray', 'Red', 'Blue', 'Green'];
  const categories = ['T-Shirts', 'Hoodies', 'Sweatshirts', 'Tank Tops', 'Long Sleeve', 'Accessories'];

  const handleMockupUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const toDataUrl = (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string) || '');
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

    try {
      const dataUrls = await Promise.all(Array.from(files).map((file) => toDataUrl(file)));
      setMockupImages((prev) => [...prev, ...dataUrls].slice(0, 10));
      toast.success('Mockup images uploaded');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload images');
    }
  };

  const handleDesignAreaUpload = async (
    file: File | null,
    setter: (url: string) => void,
    side: 'front' | 'back'
  ) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setter((reader.result as string) || '');
      toast.success(`${side === 'front' ? 'Front' : 'Back'} design area uploaded`);
      // Reset boundary when new image is uploaded
      if (side === 'front') {
        setFrontBoundary(null);
      } else {
        setBackBoundary(null);
      }
    };
    reader.onerror = () => toast.error('Failed to upload design area');
    reader.readAsDataURL(file);
  };

  const handleRemoveMockup = (index: number) => {
    setMockupImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    if (!category) {
      toast.error('Please select a category');
      return;
    }
    if (!basePrice || parseFloat(basePrice) <= 0) {
      toast.error('Please enter a valid base price');
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

    const newProduct: Product = {
      id: `product-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(basePrice),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
      mockupUrl: mockupImages[0],
      mockupUrls: mockupImages,
      baseProduct: category.toLowerCase().replace(/\s+/g, '-'),
      designs: {
        front: designAreaFront || undefined,
        back: designAreaBack || undefined,
      },
      designBoundaries: {
        front: frontBoundary || undefined,
        back: backBoundary || undefined,
      },
      variants: {
        sizes: selectedSizes,
        colors: selectedColors,
      },
      userId: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    const existingProducts = JSON.parse(
      localStorage.getItem('shelfmerch_all_products') || '[]'
    ) as Product[];
    existingProducts.push(newProduct);
    localStorage.setItem('shelfmerch_all_products', JSON.stringify(existingProducts));

    toast.success('Product added to catalog');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-fit gap-2 px-0 text-muted-foreground"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Add Base Product</h1>
              <p className="text-sm text-muted-foreground">
                Create a new product for the platform catalog
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/admin')}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Add Product</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Product name, description, and category details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Premium Cotton T-Shirt"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    placeholder="e.g. ShelfMerch"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the product details, materials, and features..."
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>Set base and compare-at pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Base Price *</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compareAtPrice">Compare-at Price</Label>
                    <Input
                      id="compareAtPrice"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Design Areas (Optional)</CardTitle>
                <CardDescription>
                  Upload mockup images and define printable area boundaries for front and back
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Front Design Area</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => frontDesignRef.current?.click()}
                    >
                      {designAreaFront ? 'Change Mockup' : 'Upload Mockup'}
                    </Button>
                    {designAreaFront && (
                      <Dialog open={isEditingFront} onOpenChange={setIsEditingFront}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <Maximize2 className="h-4 w-4" />
                            {frontBoundary ? 'Edit Boundary' : 'Set Boundary'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Define Front Design Boundary</DialogTitle>
                            <DialogDescription>
                              Draw a rectangle to define the printable area on the mockup
                            </DialogDescription>
                          </DialogHeader>
                          <BoundaryEditor
                            imageUrl={designAreaFront}
                            boundary={frontBoundary}
                            onBoundaryChange={setFrontBoundary}
                            onClose={() => setIsEditingFront(false)}
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  <input
                    ref={frontDesignRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files &&
                      handleDesignAreaUpload(e.target.files[0], setDesignAreaFront, 'front')
                    }
                  />
                  {designAreaFront && (
                    <div className="relative w-full rounded border overflow-hidden bg-muted">
                      <img
                        src={designAreaFront}
                        alt="Front design area"
                        className="w-full h-48 object-contain"
                      />
                      {frontBoundary && (
                        <div
                          className="absolute border-2 border-dashed border-white shadow-lg pointer-events-none"
                          style={{
                            left: `${frontBoundary.x}%`,
                            top: `${frontBoundary.y}%`,
                            width: `${frontBoundary.width}%`,
                            height: `${frontBoundary.height}%`,
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Back Design Area</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => backDesignRef.current?.click()}
                    >
                      {designAreaBack ? 'Change Mockup' : 'Upload Mockup'}
                    </Button>
                    {designAreaBack && (
                      <Dialog open={isEditingBack} onOpenChange={setIsEditingBack}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <Maximize2 className="h-4 w-4" />
                            {backBoundary ? 'Edit Boundary' : 'Set Boundary'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Define Back Design Boundary</DialogTitle>
                            <DialogDescription>
                              Draw a rectangle to define the printable area on the mockup
                            </DialogDescription>
                          </DialogHeader>
                          <BoundaryEditor
                            imageUrl={designAreaBack}
                            boundary={backBoundary}
                            onBoundaryChange={setBackBoundary}
                            onClose={() => setIsEditingBack(false)}
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  <input
                    ref={backDesignRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files &&
                      handleDesignAreaUpload(e.target.files[0], setDesignAreaBack, 'back')
                    }
                  />
                  {designAreaBack && (
                    <div className="relative w-full rounded border overflow-hidden bg-muted">
                      <img
                        src={designAreaBack}
                        alt="Back design area"
                        className="w-full h-48 object-contain"
                      />
                      {backBoundary && (
                        <div
                          className="absolute border-2 border-dashed border-white shadow-lg pointer-events-none"
                          style={{
                            left: `${backBoundary.x}%`,
                            top: `${backBoundary.y}%`,
                            width: `${backBoundary.width}%`,
                            height: `${backBoundary.height}%`,
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mockup Images *</CardTitle>
                <CardDescription>
                  Upload product mockup images (up to 10)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => mockupInputRef.current?.click()}
                >
                  <Plus className="h-4 w-4" />
                  Upload Mockup Images
                </Button>
                <input
                  ref={mockupInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleMockupUpload(e.target.files)}
                />

                <div className="grid grid-cols-2 gap-4">
                  {mockupImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Mockup ${index + 1}`}
                        className="w-full aspect-square object-cover rounded border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveMockup(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Sizes *</CardTitle>
                <CardDescription>Select available product sizes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <label
                      key={size}
                      className="flex items-center gap-2 px-3 py-2 rounded border cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        checked={selectedSizes.includes(size)}
                        onCheckedChange={() => toggleSize(size)}
                      />
                      <span className="text-sm font-medium">{size}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Colors *</CardTitle>
                <CardDescription>Select available product colors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <label
                      key={color}
                      className="flex items-center gap-2 px-3 py-2 rounded border cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        checked={selectedColors.includes(color)}
                        onCheckedChange={() => toggleColor(color)}
                      />
                      <span className="text-sm font-medium">{color}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminProductCreation;
