import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  X
} from "lucide-react";

const Designer = () => {
  const { id } = useParams();
  const [selectedSide, setSelectedSide] = useState<"front" | "back">("front");

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Toolbar */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <X className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Undo2 className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Redo2 className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">Edit</Button>
          <Button variant="default" className="bg-primary hover:bg-primary-hover text-primary-foreground">
            Preview
          </Button>
          <Button variant="ghost" size="icon">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <div className="w-20 border-r flex flex-col items-center py-4 gap-4">
          <button className="flex flex-col items-center gap-1 p-2 hover:bg-muted rounded-lg transition-colors">
            <Upload className="w-6 h-6" />
            <span className="text-xs">Upload</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 hover:bg-muted rounded-lg transition-colors">
            <Type className="w-6 h-6" />
            <span className="text-xs">Add text</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 hover:bg-muted rounded-lg transition-colors">
            <Folder className="w-6 h-6" />
            <span className="text-xs">My library</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 hover:bg-muted rounded-lg transition-colors">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs">Graphics</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 hover:bg-muted rounded-lg transition-colors">
            <Sparkles className="w-6 h-6" />
            <span className="text-xs">AI Tools</span>
          </button>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center bg-muted/30 relative">
          {/* Canvas Controls */}
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-background rounded-lg p-2 shadow-card">
            <Button variant="ghost" size="icon">
              <Move className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-border" />
            <Button variant="ghost" size="icon">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Trash2 className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-border" />
            <span className="text-sm px-2">Apply to all areas</span>
          </div>

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
            <Button variant="ghost" size="icon">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm px-2">133%</span>
            <Button variant="ghost" size="icon">
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

            <Tabs defaultValue="variants">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="variants" className="flex-1">Variants</TabsTrigger>
                <TabsTrigger value="layers" className="flex-1">Layers</TabsTrigger>
              </TabsList>

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
                <p className="text-sm text-muted-foreground">
                  No layers added yet. Upload an image or add text to get started.
                </p>
              </TabsContent>
            </Tabs>

            <Button 
              size="lg" 
              className="w-full mt-8 bg-[#a3e635] hover:bg-[#84cc16] text-black font-semibold"
            >
              Save product
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Designer;
