import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Upload, 
  Type, 
  Image as ImageIcon, 
  Folder, 
  Sparkles,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Move,
  Copy,
  Trash2,
  X,
  Save,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Product } from "@/types";
import StoreWizardModal from "@/components/StoreWizardModal";

interface Layer {
  id: string;
  type: 'image' | 'text';
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
}

const Designer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addProduct, store } = useData();
  const [selectedSide, setSelectedSide] = useState<"front" | "back">("front");
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [zoom, setZoom] = useState(133);
  const [productName, setProductName] = useState(`Custom ${id || 'Product'}`);
  const [price, setPrice] = useState("24.99");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newLayer: Layer = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'image',
          content: event.target?.result as string,
          x: 150,
          y: 200,
          width: 100,
          height: 100,
        };
        setLayers([...layers, newLayer]);
        toast.success('Image uploaded successfully');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddText = () => {
    if (!textInput.trim()) {
      toast.error('Please enter some text');
      return;
    }
    
    const newLayer: Layer = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      content: textInput,
      x: 170,
      y: 250,
      fontSize: 24,
    };
    setLayers([...layers, newLayer]);
    setTextInput("");
    toast.success('Text added successfully');
  };

  const handleDeleteLayer = () => {
    if (selectedLayer) {
      setLayers(layers.filter(l => l.id !== selectedLayer));
      setSelectedLayer(null);
      toast.success('Layer deleted');
    }
  };

  const handleSaveProduct = () => {
    if (layers.length === 0) {
      toast.error('Please add at least one design element');
      return;
    }

    if (!productName.trim()) {
      toast.error('Please enter a product name');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (!user?.id) {
      toast.error('Please log in to save products');
      return;
    }

    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      name: productName.trim(),
      description: `Custom designed ${id} with ${layers.length} design elements`,
      baseProduct: id || 'custom',
      price: priceNum,
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
      mockupUrls: [],
      designs: {
        [selectedSide]: 'mockup-data', // In production, this would be actual design data
      },
      variants: {
        colors: ['White', 'Black', 'Gray'],
        sizes: ['S', 'M', 'L', 'XL', '2XL'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      addProduct(newProduct);
      toast.success('Product saved successfully!');

      // Check if user has a store
      setTimeout(() => {
        if (!store) {
          setShowWizard(true);
        } else {
          navigate('/dashboard');
        }
      }, 1000);
    } catch (error) {
      console.error('Storage error:', error);
      toast.error('Failed to save product. Please try again.');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Toolbar */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <X className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" disabled>
            <Undo2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" disabled>
            <Redo2 className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Product Designer</span>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary-hover text-primary-foreground gap-2"
            onClick={handleSaveProduct}
          >
            <Save className="w-4 h-4" />
            Save Product
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-64 border-r flex flex-col p-4 gap-4 overflow-y-auto">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Upload Image</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Upload Image
            </Button>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Add Text</Label>
            <div className="space-y-2">
              <Input
                placeholder="Enter text..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddText()}
              />
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={handleAddText}
              >
                <Type className="w-4 h-4" />
                Add Text
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Quick Actions</Label>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2" disabled>
                <Folder className="w-4 h-4" />
                My Library
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" disabled>
                <ImageIcon className="w-4 h-4" />
                Graphics
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" disabled>
                <Sparkles className="w-4 h-4" />
                AI Tools
              </Button>
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center bg-muted/30 relative">
          {/* Canvas Controls */}
          {selectedLayer && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-background rounded-lg p-2 shadow-card">
              <Button variant="ghost" size="icon" disabled>
                <Move className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-border" />
              <Button variant="ghost" size="icon" disabled>
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDeleteLayer}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* T-shirt Preview */}
          <div className="relative">
            <svg viewBox="0 0 400 500" className="w-96 h-auto">
              {/* T-shirt outline */}
              <path
                d="M 100 100 L 80 140 L 80 480 L 320 480 L 320 140 L 300 100 L 260 100 L 240 80 L 160 80 L 140 100 Z"
                fill="#e5e5e5"
                stroke="#999"
                strokeWidth="2"
              />
              {/* Neck */}
              <ellipse cx="200" cy="95" rx="40" ry="20" fill="#e5e5e5" stroke="#999" strokeWidth="2" />
              {/* Sleeves */}
              <path d="M 100 100 L 60 180 L 80 200 L 100 150 Z" fill="#d4d4d4" stroke="#999" strokeWidth="2" />
              <path d="M 300 100 L 340 180 L 320 200 L 300 150 Z" fill="#d4d4d4" stroke="#999" strokeWidth="2" />
              
              {/* Print area */}
              <rect
                x="140"
                y="180"
                width="120"
                height="140"
                fill="none"
                stroke="#26A17B"
                strokeWidth="2"
                strokeDasharray="5,5"
                rx="4"
              />
              
              {/* Render layers */}
              {layers.map((layer) => (
                <g key={layer.id} onClick={() => setSelectedLayer(layer.id)}>
                  {layer.type === 'image' ? (
                    <image
                      href={layer.content}
                      x={layer.x}
                      y={layer.y}
                      width={layer.width}
                      height={layer.height}
                      style={{ cursor: 'pointer' }}
                    />
                  ) : (
                    <text
                      x={layer.x}
                      y={layer.y}
                      fontSize={layer.fontSize}
                      fill="#000"
                      style={{ cursor: 'pointer' }}
                    >
                      {layer.content}
                    </text>
                  )}
                  {selectedLayer === layer.id && (
                    <rect
                      x={layer.x - 2}
                      y={layer.y - 2}
                      width={layer.width || 100}
                      height={layer.height || layer.fontSize || 24}
                      fill="none"
                      stroke="#26A17B"
                      strokeWidth="2"
                    />
                  )}
                </g>
              ))}
            </svg>

            {/* Side Selector */}
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
              <Button
                variant={selectedSide === "front" ? "default" : "outline"}
                onClick={() => setSelectedSide("front")}
                className={selectedSide === "front" ? "bg-primary hover:bg-primary-hover" : ""}
              >
                Front side
              </Button>
              <Button
                variant={selectedSide === "back" ? "default" : "outline"}
                onClick={() => setSelectedSide("back")}
                className={selectedSide === "back" ? "bg-primary hover:bg-primary-hover" : ""}
              >
                Back side
              </Button>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-background rounded-lg p-2 shadow-card">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setZoom(Math.max(50, zoom - 10))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm px-2">{zoom}%</span>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setZoom(Math.min(200, zoom + 10))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-96 border-l bg-background overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold">Variants and layers</h2>
              <Button variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <Tabs defaultValue="details">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                <TabsTrigger value="variants" className="flex-1">Variants</TabsTrigger>
                <TabsTrigger value="layers" className="flex-1">Layers</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div>
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="My Custom Product"
                  />
                </div>

                <div>
                  <Label htmlFor="price" className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Price
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="24.99"
                  />
                </div>

                <div>
                  <Label htmlFor="comparePrice">Compare at Price (Optional)</Label>
                  <Input
                    id="comparePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="34.99"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Show original price for discount display
                  </p>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Customer pays:</span>
                    <span className="text-lg font-bold">₹{price || '0.00'}</span>
                  </div>
                  {compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price || '0') && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>You save:</span>
                      <span className="font-semibold text-green-600">
                        ₹{(parseFloat(compareAtPrice) - parseFloat(price || '0')).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="variants" className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Colors</h3>
                    <Button variant="link" size="sm" className="text-primary">
                      Select variants
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-full border-2 border-primary bg-gray-200" />
                    <div className="w-10 h-10 rounded-full border bg-gray-800" />
                    <div className="w-10 h-10 rounded-full border bg-white" />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {["XS", "S", "M", "L", "XL", "2XL", "3XL"].map((size) => (
                      <Button
                        key={size}
                        variant="outline"
                        size="sm"
                        className="min-w-[60px]"
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layers" className="space-y-4">
                {layers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No layers added yet. Upload an image or add text to get started.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {layers.map((layer, index) => (
                      <div
                        key={layer.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedLayer === layer.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedLayer(layer.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {layer.type === 'image' ? (
                              <ImageIcon className="w-4 h-4" />
                            ) : (
                              <Type className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">
                              {layer.type === 'image' ? 'Image' : 'Text'} {index + 1}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLayers(layers.filter(l => l.id !== layer.id));
                              if (selectedLayer === layer.id) setSelectedLayer(null);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        {layer.type === 'text' && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {layer.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Button 
              size="lg" 
              className="w-full mt-8 bg-primary hover:bg-primary-hover text-primary-foreground"
              onClick={handleSaveProduct}
              disabled={layers.length === 0}
            >
              Save product
            </Button>
          </div>
        </div>
      </div>

      {/* Store Wizard Modal */}
      <StoreWizardModal open={showWizard} onClose={() => setShowWizard(false)} />
    </div>
  );
};

export default Designer;
