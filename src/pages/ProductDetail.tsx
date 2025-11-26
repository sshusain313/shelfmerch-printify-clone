import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { productApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Check, Package, Palette, Ruler, Droplets, Wind,
  Thermometer, X, Heart, Share2, Truck, Shield,
  Award, Sparkles, TrendingUp, Star, ZoomIn,
  ChevronRight, Home, Minus, Plus, Maximize2
} from "lucide-react";
import { toast } from "sonner";

// Color name to hex mapping
const colorMap: Record<string, string> = {
  'white': '#FFFFFF',
  'black': '#000000',
  'gray': '#808080',
  'grey': '#808080',
  'maroon': '#800000',
  'red': '#FF0000',
  'blue': '#0000FF',
  'navy': '#000080',
  'green': '#008000',
  'yellow': '#FFFF00',
  'orange': '#FFA500',
  'pink': '#FFC0CB',
  'purple': '#800080',
  'brown': '#A52A2A',
  'beige': '#F5F5DC',
  'cream': '#FFFDD0',
  'khaki': '#C3B091',
  'olive': '#808000',
  'teal': '#008080',
  'cyan': '#00FFFF',
  'lime': '#00FF00',
  'magenta': '#FF00FF',
  'coral': '#FF7F50',
  'salmon': '#FA8072',
  'tan': '#D2B48C',
  'burgundy': '#800020',
  'charcoal': '#36454F',
  'ivory': '#FFFFF0',
  'mint': '#98FF98',
  'lavender': '#E6E6FA',
  'peach': '#FFE5B4',
};

const getColorHex = (colorName: string): string => {
  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || '#CCCCCC';
};

// Standard size chart data
const sizeChartData = {
  'S': { chest: '36-38"', length: '28"', sleeve: '8.5"' },
  'M': { chest: '40-42"', length: '29"', sleeve: '9"' },
  'L': { chest: '44-46"', length: '30"', sleeve: '9.5"' },
  'XL': { chest: '48-50"', length: '31"', sleeve: '10"' },
  '2XL': { chest: '52-54"', length: '32"', sleeve: '10.5"' },
  '3XL': { chest: '56-58"', length: '33"', sleeve: '11"' },
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const [isStickyVisible, setIsStickyVisible] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const response = await productApi.getById(id);
        if (response && response.success && response.data) {
          setProduct(response.data);
          const primaryIndex = response.data.galleryImages?.findIndex((img: any) => img.isPrimary) ?? 0;
          setSelectedImageIndex(primaryIndex >= 0 ? primaryIndex : 0);
        } else {
          toast.error('Product not found');
          navigate('/products');
        }
      } catch (error: any) {
        console.error('Failed to fetch product:', error);
        toast.error(error.message || 'Failed to load product');
        navigate('/products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  // Fetch related products
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product) return;

      setIsLoadingRelated(true);
      try {
        const response = await productApi.getCatalogProducts({
          page: 1,
          limit: 4,
          category: product.catalogue?.categoryId
        });
        if (response && response.success && response.data) {
          const filtered = response.data
            .filter((p: any) => p._id !== product._id)
            .slice(0, 4);
          setRelatedProducts(filtered);
        }
      } catch (error) {
        console.error('Failed to fetch related products:', error);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    if (product) {
      fetchRelatedProducts();
    }
  }, [product]);

  // Set initial selected color and size
  useEffect(() => {
    if (product?.availableColors && product.availableColors.length > 0) {
      setSelectedColor(product.availableColors[0]);
    }
    if (product?.availableSizes && product.availableSizes.length > 0) {
      setSelectedSize(product.availableSizes[0]);
    }
  }, [product]);

  // Sticky CTA visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsStickyVisible(scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Image zoom handler
  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  // Share functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.catalogue?.name,
          text: `Check out ${product.catalogue?.name} on ShelfMerch`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-6 lg:py-8">
          <Skeleton className="h-6 w-64 mb-6" />
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12">
            <div>
              <Skeleton className="aspect-square w-full rounded-xl mb-4" />
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="aspect-square w-full rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-8">
          <div className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Product not found</h2>
            <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or is no longer available.</p>
            <Button asChild>
              <Link to="/products">Back to Products</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const galleryImages = product.galleryImages || [];
  const selectedImage = galleryImages[selectedImageIndex];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-6 lg:py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/products">Products</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {product.catalogue?.categoryId && (
              <>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="capitalize">
                    {product.catalogue.categoryId}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1">
                {product.catalogue?.name || 'Product'}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div
              ref={imageRef}
              className="relative aspect-square bg-muted rounded-xl overflow-hidden group cursor-zoom-in"
              onMouseMove={handleImageMouseMove}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onClick={() => setIsImageModalOpen(true)}
            >
              {selectedImage ? (
                <>
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.altText || product.catalogue?.name || 'Product'}
                    className="w-full h-full object-cover transition-transform duration-300"
                    style={{
                      transform: isZoomed ? `scale(1.5)` : 'scale(1)',
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
                      <Maximize2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {galleryImages.map((img: any, index: number) => (
                  <div
                    key={img.id || index}
                    className={`aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-transparent hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={img.url}
                      alt={img.altText || `Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand & Tags */}
            <div>
              {product.catalogue?.brand && (
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  {product.catalogue.brand}
                </p>
              )}
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-3">
                {product.catalogue?.name || 'Unnamed Product'}
              </h1>
              {product.catalogue?.tags && product.catalogue.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {product.catalogue.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs px-2.5 py-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 pb-4 border-b">
              <span className="text-sm text-muted-foreground font-medium">From</span>
              <span className="text-4xl lg:text-5xl font-bold">
                ${product.catalogue?.basePrice?.toFixed(2) || '0.00'}
              </span>
            </div>

            {/* Product Features - Dynamic from attributes */}
            <div className="space-y-2.5">
              {product.catalogue?.attributes && (() => {
                // Convert attributes object to array and limit to 7
                const attributes = Object.entries(product.catalogue.attributes)
                  .filter(([key, value]) => value && value !== '')
                  .slice(0, 7);
                
                // Comprehensive label formatting for all categories
                const formatLabel = (key: string, value: any) => {
                  const formatters: Record<string, (val: any) => string> = {
                    // Apparel attributes
                    'gender': (val) => `For ${val}`,
                    'material': (val) => val,
                    'gsm': (val) => `${val} GSM`,
                    'fit': (val) => `${val} fit`,
                    'brand': (val) => `Brand: ${val}`,
                    'collarType': (val) => `${val} collar`,
                    'fabricComposition': (val) => val,
                    'sleeveLength': (val) => val,
                    'hoodType': (val) => `${val} hood`,
                    'pocketStyle': (val) => `${val} pockets`,
                    'neckline': (val) => `${val} neckline`,
                    
                    // Accessories attributes
                    'handleType': (val) => `${val} handles`,
                    'capStyle': (val) => `${val} style`,
                    'visorType': (val) => `${val} visor`,
                    'compatibility': (val) => `Fits ${val}`,
                    'caseType': (val) => `${val} case`,
                    
                    // Home attributes
                    'capacity': (val) => `Capacity: ${val}`,
                    'dishwasherSafe': (val) => `Dishwasher ${val === 'Yes' ? '✓' : '✗'}`,
                    'microwaveSafe': (val) => `Microwave ${val === 'Yes' ? '✓' : '✗'}`,
                    'dimensions': (val) => `Size: ${val}`,
                    'fillMaterial': (val) => `Filled with ${val}`,
                    'frameSize': (val) => `${val} frame`,
                    'frameMaterial': (val) => `${val} frame`,
                    
                    // Print attributes
                    'paperType': (val) => `${val} paper`,
                    'paperWeight': (val) => `${val} paper`,
                    'finish': (val) => `${val} finish`,
                    'corners': (val) => `${val} corners`,
                    'size': (val) => `Size: ${val}`,
                    'stickerType': (val) => `${val} sticker`,
                    'waterproof': (val) => val === 'Yes' ? 'Waterproof' : 'Not waterproof',
                    'pageCount': (val) => `${val} pages`,
                    'binding': (val) => `${val} binding`,
                    'ruling': (val) => `${val} pages`,
                    
                    // Packaging attributes
                    'recyclable': (val) => val === 'Yes' ? 'Recyclable' : val === 'Partially' ? 'Partially recyclable' : 'Not recyclable',
                    'boxType': (val) => `${val} box`,
                    'capType': (val) => `${val} cap`,
                    'pouchType': (val) => `${val} pouch`,
                    
                    // Tech attributes
                    'model': (val) => `Model: ${val}`,
                    'protection': (val) => `${val} protection`,
                    'accessoryType': (val) => val,
                    
                    // Jewelry attributes
                    'hypoallergenic': (val) => val === 'Yes' ? 'Hypoallergenic' : 'Contains allergens',
                    'ringSize': (val) => `Size: ${val}`,
                    'bandWidth': (val) => `${val} band`,
                    'chainLength': (val) => `${val} chain`,
                    'chainType': (val) => `${val} chain`,
                    'claspType': (val) => `${val} clasp`,
                    'earringType': (val) => `${val} style`,
                    'backingType': (val) => `${val} backing`,
                  };
                  
                  return formatters[key] ? formatters[key](value) : `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`;
                };
                
                return attributes.map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2.5">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{formatLabel(key, value)}</span>
                </div>
                ));
              })()}
            </div>

            {/* Size Selector */}
            {product.availableSizes && product.availableSizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Available Sizes</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.availableSizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${
                        selectedSize === size
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50 bg-background'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Specifications */}
            {product.availableColors && product.availableColors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">Available Colors</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.availableColors.map((color: string) => {
                    const colorHex = getColorHex(color);
                    // const isSelected = selectedColor === color;
                    return (
                      <div
                        key={color}
                        className="flex flex-col items-center gap-2 cursor-pointer group"
                        // onClick={() => setSelectedColor(color)}
                      >
                        <div
                          className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 transition-all relative"
                          style={{ backgroundColor: colorHex }}
                          title={color}
                        >
                         
                        </div>
                        {/* <span className={`text-xs font-medium transition-colors ${
                          isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        }`}>
                          {color}
                        </span> */}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                size="lg"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold h-12"
                asChild
              >
                <Link to={`/designer/${id}`}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Designing
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-12 w-12 p-0">
                <Heart className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-12 w-12 p-0"
                onClick={handleShare}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex items-start gap-3 p-4 bg-accent/50 rounded-lg border">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">On orders $50+</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-accent/50 rounded-lg border">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5">Secure Payment</p>
                  <p className="text-xs text-muted-foreground">100% Protected</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-accent/50 rounded-lg border">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5">Quality</p>
                  <p className="text-xs text-muted-foreground">Guaranteed</p>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            {/* {product.shipping && (
              <div className="p-6 bg-accent/30 rounded-lg border">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Shipping Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Package Dimensions</p>
                    <p className="font-medium">
                      {product.shipping.packageLengthCm} × {product.shipping.packageWidthCm} × {product.shipping.packageHeightCm} cm
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Weight</p>
                    <p className="font-medium">{product.shipping.packageWeightGrams}g</p>
                  </div>
                </div>
              </div>
            )} */}
          </div>
        </div>

        {/* Detailed Information - All Sections */}
        <div className="mt-10 lg:mt-12 space-y-8">
          {/* About Section */}
          <Card>
            <CardContent className="p-6 lg:p-8">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-6 h-6 text-primary" />
                Product Description
              </h3>
              <p className="text-muted-foreground leading-relaxed text-base">
                {product.catalogue?.description || 'No description available.'}
              </p>

              {product.catalogue?.categoryId && (
                <div className="mt-8 pt-6 border-t">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-muted-foreground">Category: </span>
                      <span className="text-foreground capitalize">{product.catalogue.categoryId}</span>
                    </div>
                    {product.catalogue?.subcategoryIds && product.catalogue.subcategoryIds.length > 0 && (
                      <div>
                        <span className="font-semibold text-muted-foreground">Subcategories: </span>
                        <span className="text-foreground">
                          {product.catalogue.subcategoryIds.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Size Chart Section */}
          <Card>
            <CardContent className="p-6 lg:p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Ruler className="w-6 h-6 text-primary" />
                Size Chart
              </h3>
              {product.availableSizes && product.availableSizes.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="text-left p-4 font-semibold">Size</th>
                        <th className="text-center p-4 font-semibold">Chest</th>
                        <th className="text-center p-4 font-semibold">Length</th>
                        <th className="text-center p-4 font-semibold">Sleeve</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.availableSizes.map((size: string) => {
                        const sizeData = sizeChartData[size as keyof typeof sizeChartData] || {
                          chest: 'N/A',
                          length: 'N/A',
                          sleeve: 'N/A'
                        };
                        return (
                          <tr key={size} className="border-b border-border hover:bg-accent/50 transition-colors">
                            <td className="p-4 font-semibold">{size}</td>
                            <td className="p-4 text-center text-muted-foreground">{sizeData.chest}</td>
                            <td className="p-4 text-center text-muted-foreground">{sizeData.length}</td>
                            <td className="p-4 text-center text-muted-foreground">{sizeData.sleeve}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">Size information not available.</p>
              )}
            </CardContent>
          </Card>

          {/* Care Instructions Section */}
          <Card>
            <CardContent className="p-6 lg:p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Droplets className="w-6 h-6 text-primary" />
                Care Instructions
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                      <Droplets className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Washing</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Machine wash cold with like colors. Use mild detergent. Do not bleach.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                      <Wind className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Drying</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Tumble dry low or hang dry. Do not iron on print area.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                      <Thermometer className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Ironing</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Iron on low heat. Avoid ironing directly on printed areas.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                      <X className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Do Not</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Do not dry clean. Do not use fabric softener. Do not bleach.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Specifications Section - Dynamic */}
          {product.catalogue?.attributes && Object.keys(product.catalogue.attributes).length > 0 && (
          <Card>
            <CardContent className="p-6 lg:p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Award className="w-6 h-6 text-primary" />
                Product Specifications
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                  {(() => {
                    // Comprehensive icon mapping for all categories
                    const getIcon = (key: string) => {
                      const iconMap: Record<string, any> = {
                        // Apparel
                        'gender': Award,
                        'material': Package,
                        'gsm': Ruler,
                        'fit': Check,
                        'brand': Star,
                        'collarType': Award,
                        'fabricComposition': Sparkles,
                        'sleeveLength': Ruler,
                        'hoodType': Package,
                        'pocketStyle': Package,
                        'neckline': Award,
                        
                        // Accessories
                        'handleType': Package,
                        'capStyle': Award,
                        'visorType': Ruler,
                        'compatibility': Check,
                        'caseType': Shield,
                        
                        // Home
                        'capacity': Package,
                        'dishwasherSafe': Droplets,
                        'microwaveSafe': Thermometer,
                        'dimensions': Ruler,
                        'fillMaterial': Package,
                        'frameSize': Ruler,
                        'frameMaterial': Package,
                        
                        // Print
                        'paperType': Package,
                        'paperWeight': Ruler,
                        'finish': Sparkles,
                        'corners': Check,
                        'size': Ruler,
                        'stickerType': Package,
                        'waterproof': Shield,
                        'pageCount': Package,
                        'binding': Package,
                        'ruling': Check,
                        
                        // Packaging
                        'recyclable': Award,
                        'boxType': Package,
                        'capType': Package,
                        'pouchType': Package,
                        
                        // Tech
                        'model': Star,
                        'protection': Shield,
                        'accessoryType': Package,
                        
                        // Jewelry
                        'hypoallergenic': Shield,
                        'ringSize': Ruler,
                        'bandWidth': Ruler,
                        'chainLength': Ruler,
                        'chainType': Package,
                        'claspType': Package,
                        'earringType': Star,
                        'backingType': Package,
                      };
                      return iconMap[key] || Package;
                    };

                    // Comprehensive label formatting for all categories
                    const formatLabel = (key: string) => {
                      const labelMap: Record<string, string> = {
                        // Apparel
                        'gender': 'Target Audience',
                        'material': 'Material',
                        'gsm': 'GSM (Grams per Square Meter)',
                        'fit': 'Fit Style',
                        'brand': 'Brand',
                        'collarType': 'Collar Type',
                        'fabricComposition': 'Fabric Composition',
                        'sleeveLength': 'Sleeve Length',
                        'hoodType': 'Hood Type',
                        'pocketStyle': 'Pocket Style',
                        'neckline': 'Neckline',
                        
                        // Accessories
                        'handleType': 'Handle Type',
                        'capStyle': 'Cap Style',
                        'visorType': 'Visor Type',
                        'compatibility': 'Device Compatibility',
                        'caseType': 'Case Type',
                        
                        // Home
                        'capacity': 'Capacity',
                        'dishwasherSafe': 'Dishwasher Safe',
                        'microwaveSafe': 'Microwave Safe',
                        'dimensions': 'Dimensions',
                        'fillMaterial': 'Fill Material',
                        'frameSize': 'Frame Size',
                        'frameMaterial': 'Frame Material',
                        
                        // Print
                        'paperType': 'Paper Type',
                        'paperWeight': 'Paper Weight',
                        'finish': 'Finish',
                        'corners': 'Corner Style',
                        'size': 'Size',
                        'stickerType': 'Sticker Type',
                        'waterproof': 'Waterproof',
                        'pageCount': 'Page Count',
                        'binding': 'Binding Type',
                        'ruling': 'Page Ruling',
                        
                        // Packaging
                        'recyclable': 'Recyclable',
                        'boxType': 'Box Type',
                        'capType': 'Cap Type',
                        'pouchType': 'Pouch Type',
                        
                        // Tech
                        'model': 'Device Model',
                        'protection': 'Protection Level',
                        'accessoryType': 'Accessory Type',
                        
                        // Jewelry
                        'hypoallergenic': 'Hypoallergenic',
                        'ringSize': 'Ring Size',
                        'bandWidth': 'Band Width',
                        'chainLength': 'Chain Length',
                        'chainType': 'Chain Type',
                        'claspType': 'Clasp Type',
                        'earringType': 'Earring Type',
                        'backingType': 'Backing Type',
                      };
                      
                      return labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                    };

                    const attributes = Object.entries(product.catalogue.attributes)
                      .filter(([key, value]) => value && value !== '');

                    return attributes.map(([key, value]) => {
                      const IconComponent = getIcon(key);
                      return (
                        <div key={key} className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                            <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                            <h4 className="font-semibold mb-1">{formatLabel(key)}</h4>
                            <p className="text-sm text-muted-foreground">{String(value)}</p>
                      </div>
                    </div>
                      );
                    });
                  })()}
                  {product.design?.dpi && (
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                        <Star className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Print Resolution</h4>
                        <p className="text-sm text-muted-foreground">{product.design.dpi} DPI</p>
                      </div>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
          )}
        </div>

        {/* You May Also Like */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 lg:mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                You May Also Like
              </h2>
              <Link to="/products" className="text-sm font-medium text-primary hover:underline hidden sm:inline">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {isLoadingRelated ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-0">
                      <Skeleton className="aspect-square w-full" />
                      <div className="p-4 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-5 w-1/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                relatedProducts.map((relatedProduct: any) => {
                  const primaryImage = relatedProduct.galleryImages?.find((img: any) => img.isPrimary)?.url ||
                    relatedProduct.galleryImages?.[0]?.url || '';
                  return (
                    <Link key={relatedProduct._id} to={`/products/${relatedProduct._id}`} className="group">
                      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                        <CardContent className="p-0">
                          <div className="relative aspect-square bg-muted overflow-hidden">
                            <img
                              src={primaryImage}
                              alt={relatedProduct.catalogue?.name || 'Product'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {relatedProduct.catalogue?.tags?.[0] && (
                              <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                                {relatedProduct.catalogue.tags[0]}
                              </Badge>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                              {relatedProduct.catalogue?.name || 'Unnamed Product'}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {relatedProduct.catalogue?.brand || 'ShelfMerch'}
                            </p>
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-lg">
                                ${relatedProduct.catalogue?.basePrice?.toFixed(2) || '0.00'}
                              </p>
                              {relatedProduct.availableSizes && relatedProduct.availableColors && (
                                <p className="text-xs text-muted-foreground hidden sm:inline">
                                  {relatedProduct.availableSizes.length} sizes · {relatedProduct.availableColors.length} colors
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* FAQ's */}
      <div className="container mx-auto mt-10 mb-10 lg:mt-12 lg:mb-12">
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4 lg:gap-1">
          {/* <h2 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            FAQ's
          </h2> */}
          
            <Accordion type="multiple" className="w-full">
            {product.faqs?.map((faq: any, index: number)=>{
                return (
            <AccordionItem value={`faq-${index}`} key={faq._id} >
              <AccordionTrigger>
              <h3 className="text-lg font-semibold">{faq.question}</h3>
              </AccordionTrigger>
            <AccordionContent>
                <div key={faq._id}>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
            )})}
            </Accordion>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-6xl w-full p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Product Image</DialogTitle>
          </DialogHeader>
          <div className="relative">
            {selectedImage && (
              <img
                src={selectedImage.url}
                alt={selectedImage.altText || product.catalogue?.name || 'Product'}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm rounded-full p-2">
                {galleryImages.map((img: any, index: number) => (
                  <button
                    key={img.id || index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary ring-2 ring-primary'
                        : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticky CTA Bar (Mobile) */}
      {isStickyVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg lg:hidden">
          <div className="container py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">From</p>
                <p className="text-xl font-bold">${product.catalogue?.basePrice?.toFixed(2) || '0.00'}</p>
              </div>
              <Button
                size="lg"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                asChild
              >
                <Link to={`/designer/${id}`}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Design Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetail;
