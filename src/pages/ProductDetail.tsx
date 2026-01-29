import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { productApi } from "@/lib/api";
import { TrustBadges } from "@/components/TrustBadges";
import { CareInstructions } from "@/components/CareInstructions";
import { ProductDescription } from "@/components/ProductDescription";
import { SizeChart } from "@/components/SizeChart";
import { KeyFeatures } from "@/components/KeyFeatures";
import { PrintAreas } from "@/components/PrintAreas";
import { Skeleton } from "@/components/ui/skeleton";
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
// Accordion import removed – FAQ UI no longer used on product detail page.
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
  Thermometer, X, Heart, Share2, Truck, Shield, FileText, Droplet, Archive,
  Award, Sparkles, ShieldCheck, TrendingUp, Star, ZoomIn,
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

const badges = [
  {
    icon: Truck,
    title: "Free Shipping",
    subtitle: "On orders ₹500+",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    subtitle: "100% Protected",
  },
  {
    icon: Award,
    title: "Quality Guaranteed",
    subtitle: "Premium Materials",
  },
];

const instructions = [
  {
    icon: FileText,
    title: "General",
    description: "A top-choice garment known for its softness, durability, and compatibility with DTG printing, making it a favorite in both retail and promotional markets.",
  },
  {
    icon: Droplet,
    title: "Wash",
    description: "Maintain the tee's quality by washing it in cold water, which helps preserve the fabric and the vibrancy of the print.",
  },
  {
    icon: Wind,
    title: "Dry",
    description: "Tumble dry on a low setting or hang dry to retain the shape and size of the tee post-wash.",
  },
  {
    icon: Archive,
    title: "Store",
    description: "Store in a cool, dry place away from direct sunlight to maintain the integrity of the fabric and colors.",
  },
];

// Removed inline constants as they are now in components
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
  const [colorsWithHex, setColorsWithHex] = useState<Array<{ value: string; colorHex?: string }>>([]);
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
          // Build available colors with hex from variants returned by backend
          const variants: Array<any> = Array.isArray(response.data.variants) ? response.data.variants : [];
          const colorMapUnique: Record<string, string | undefined> = {};
          variants.forEach((v) => {
            if (v && typeof v.color === 'string') {
              const key = v.color;
              if (colorMapUnique[key] === undefined) {
                colorMapUnique[key] = v.colorHex || undefined;
              }
            }
          });
          const colorsArr = Object.entries(colorMapUnique).map(([value, hex]) => ({ value, colorHex: hex || getColorHex(value) }));
          setColorsWithHex(colorsArr);
          if (!selectedColor && colorsArr.length > 0) {
            setSelectedColor(colorsArr[0].value);
          }
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
        <Header />
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
        <Header />
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
      <Header />

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

        <div className="grid lg:grid-cols-8 gap-8 lg:gap-12">

          {/* Product Images */}
          {/* Product Images */}
          <div className="grid lg:col-span-5 grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Thumbnails - Left Column */}
            {galleryImages.length > 0 && (
              <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible order-2 lg:order-1">
                {galleryImages.slice(0, 4).map((img: any, index: number) => (
                  <div
                    key={img.id || index}
                    className={`aspect-square w-20 lg:w-full bg-muted rounded-lg overflow-hidden cursor-pointer border-2 flex-shrink-0 transition-all ${selectedImageIndex === index
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

            {/* Main Image - Right Columns */}
            <div
              ref={imageRef}
              className={`relative aspect-square bg-muted rounded-xl overflow-hidden group cursor-zoom-in order-1 lg:order-2 ${galleryImages.length > 0 ? 'lg:col-span-4' : 'lg:col-span-5'
                }`}
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
          </div>

          {/* Product Info */}
          <div className="space-y-6 lg:col-span-3">
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
                ₹{product.catalogue?.basePrice?.toFixed(2) || '0.00'}
              </span>
            </div>

            {/* Product Features - Dynamic from attributes */}
            {/* <div className="space-y-2.5">
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
            </div> */}

            {/* Size Selector */}
            {product.availableSizes && product.availableSizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Available Sizes</p>
                  <a
                    href="#size-chart"
                    onClick={(e) => {
                      e.preventDefault();
                      const element = document.getElementById('size-chart');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Size Chart
                  </a>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.availableSizes.map((size: string) => (
                    <span
                      key={size}
                      // onClick={() => setSelectedSize(size)}
                      className="px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Color Specifications */}
            {(colorsWithHex && colorsWithHex.length > 0) && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">Available Colors</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colorsWithHex.map((c) => {
                    const color = c.value;
                    const colorHex = c.colorHex || getColorHex(color);
                    return (
                      <div
                        key={color}
                        className="flex flex-col items-center gap-2 cursor-pointer group"
                        // onClick={() => setSelectedColor(color)}
                      >
                        <div
                          className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 transition-all relative "
                          style={{
                            backgroundColor: colorHex,
                            border: colorHex === "#FFFFFF" ? "2px solid hsl(var(--border))" : undefined
                          }}
                        >
                        </div>
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
              {/* <Button variant="outline" size="lg" className="h-12 w-12 p-0">
                <Heart className="w-5 h-5" />
              </Button> */}
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
            <div className="grid grid-cols-3 gap-3">
              {badges.map((badge) => (
                <div key={badge.title} className="trust-badge">
                  <badge.icon className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{badge.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{badge.subtitle}</p>
                  </div>
                </div>
              ))}
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

          {/* Product Description */}
          <ProductDescription
            description={product.catalogue?.description}
            category={product.catalogue?.categoryId}
            subcategoryIds={product.catalogue?.subcategoryIds}
          />

          {/* Size Chart Section */}
          <SizeChart 
            availableSizes={product.availableSizes}
            categoryId={product.catalogue?.categoryId}
          />

          {/* Key Features Section */}
          <KeyFeatures />

          {/* Care Instructions Section */}
          <CareInstructions />

          {/* Print Areas Section */}
          {/* <PrintAreas 
            design={product.design}
            // placeholderImage={product.galleryImages?.find((img: any) => img.isPrimary)?.url || product.galleryImages?.[0]?.url}
          /> */}
        </div>

        {/* You May Also Like */}
        {relatedProducts.length > 0 && (
          <div className="space-y-4 mt-6">
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
                                ₹{relatedProduct.catalogue?.basePrice?.toFixed(2) || '0.00'}
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
        )
        }
      </div >

      {/* Product-specific FAQs section removed as FAQ feature is no longer supported. */}

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
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
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
      {
        isStickyVisible && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg lg:hidden">
            <div className="container py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="text-xl font-bold">₹{product.catalogue?.basePrice?.toFixed(2) || '0.00'}</p>
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
        )
      }

      <Footer />
    </div >
  );
};

export default ProductDetail;
