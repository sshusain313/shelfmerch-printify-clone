import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProductCatalogueSection } from '@/components/admin/ProductCatalogueSection';
import { ProductVariantsSection } from '@/components/admin/ProductVariantsSection';
import { ProductImageConfigurator } from '@/components/admin/ProductImageConfigurator';
import { ProductGallerySection } from '@/components/admin/ProductGallerySection';
import { ShippingPackagingSection } from '@/components/admin/ShippingPackagingSection';
import { ProductPricingSection } from '@/components/admin/ProductPricingSection';
import { ProductStocksSection } from '@/components/admin/ProductStocksSection';
import { ProductOptionsSection } from '@/components/admin/ProductOptionsSection';
import { ProductDetailsSection } from '@/components/admin/ProductDetailsSection';
import { ProductFAQSection } from '@/components/admin/ProductFAQSection';
import { UploadMockupsSection } from '@/components/admin/UploadMockupsSection';
import {
  ProductFormData,
  ProductCatalogueData,
  ProductDesignData,
  ProductShippingData,
  ProductPricingData,
  ProductStocksData,
  ProductOptionsData,
  ProductDetailsData,
  ProductVariant,
  ProductGalleryImage,
  ProductFAQ,
  ViewConfig,
  DisplacementSettings,
} from '@/types/product';
import { productApi } from '@/lib/api';

const AdminProductCreation = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [activeStep, setActiveStep] = useState('catalogue');
  const [isLoading, setIsLoading] = useState(isEditMode);

  // SECTION A: Product Catalogue Data
  const [catalogueData, setCatalogueData] = useState<ProductCatalogueData>({
    name: '',
    description: '',
    categoryId: '',
    subcategoryIds: [],
    basePrice: 0,
    tags: [],
    productTypeCode: '',
    attributes: {},
  });

  // SECTION B: Product Details (Barcode and Identification)
  const [detailsData, setDetailsData] = useState<ProductDetailsData>({
    mpn: '',
    upc: '',
    ean13: '',
    isbn: '',
  });

  // SECTION C: Product Variants (Sizes & Colors)
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // SECTION D: Design Data (Mockup + Print Areas)
  // Default physical dimensions in inches – this should match what we use in the configurator
  const DEFAULT_PHYSICAL_WIDTH = 20;
  const DEFAULT_PHYSICAL_HEIGHT = 24;
  const DEFAULT_PHYSICAL_LENGTH = 18;

  const defaultDisplacementSettings: DisplacementSettings = {
    scaleX: 20,
    scaleY: 20,
    contrastBoost: 1.5,
  };

  const [designData, setDesignData] = useState<ProductDesignData>({
    views: [
      { key: 'front', mockupImageUrl: '', placeholders: [] },
      { key: 'back', mockupImageUrl: '', placeholders: [] },
      { key: 'left', mockupImageUrl: '', placeholders: [] },
      { key: 'right', mockupImageUrl: '', placeholders: [] },
    ],
    sampleMockups: [], // Initialize with empty array
    dpi: 300,
    physicalDimensions: {
      width: DEFAULT_PHYSICAL_WIDTH,
      height: DEFAULT_PHYSICAL_HEIGHT,
      length: DEFAULT_PHYSICAL_LENGTH,
    },
    displacementSettings: defaultDisplacementSettings,
  });

  // SECTION E: Product Gallery Images (Customer-facing display images)
  const [galleryImages, setGalleryImages] = useState<ProductGalleryImage[]>([]);

  // SECTION F: Product FAQs (Frequently Asked Questions)
  const [faqs, setFaqs] = useState<ProductFAQ[]>([]);

  // SECTION F: Shipping & Packaging Data
  const [shippingData, setShippingData] = useState<ProductShippingData>({
    packageLengthCm: 0,
    packageWidthCm: 0,
    packageHeightCm: 0,
    packageWeightGrams: 0,
  });

  // SECTION G: Pricing Data
  const [pricingData, setPricingData] = useState<ProductPricingData>({
    retailPriceTaxExcl: 0,
    taxRule: '',
    taxRate: 0,
    retailPriceTaxIncl: 0,
    costPriceTaxExcl: 0,
  });

  // SECTION H: Stocks/Inventory Data
  const [stocksData, setStocksData] = useState<ProductStocksData>({
    minimumQuantity: 1,
    stockLocation: '',
    lowStockAlertEnabled: false,
    lowStockAlertEmail: '',
    lowStockThreshold: 10,
    outOfStockBehavior: 'default',
    currentStock: undefined,
  });

  // SECTION I: Product Options/Settings Data
  const [optionsData, setOptionsData] = useState<ProductOptionsData>({
    visibility: 'everywhere',
    availableForOrder: true,
    showPrice: true,
    webOnly: false,
    suppliers: [],
  });

  // Fetch product data if in edit mode
  useEffect(() => {
    const fetchProduct = async () => {
      if (!isEditMode || !id) return;

      setIsLoading(true);
      try {
        const response = await productApi.getById(id);
        if (response && response.success === true && response.data) {
          const product = response.data;

          // Populate form with existing product data
          if (product.catalogue) {
            setCatalogueData({
              name: product.catalogue.name || '',
              description: product.catalogue.description || '',
              categoryId: product.catalogue.categoryId || '',
              subcategoryIds: product.catalogue.subcategoryIds || [],
              basePrice: product.catalogue.basePrice || 0,
              tags: product.catalogue.tags || [],
              productTypeCode: product.catalogue.productTypeCode || '',
              attributes: product.catalogue.attributes || {},
            });
          }

          if (product.details) {
            setDetailsData({
              mpn: product.details.mpn || '',
              upc: product.details.upc || '',
              ean13: product.details.ean13 || '',
              isbn: product.details.isbn || '',
            });
          }

          if (product.design) {
            // Migrate old placeholders (wIn/hIn) to new format (widthIn/heightIn)
            // Preserve any new polygon/magnetic lasso fields if present
            const migratedViews = (product.design.views || []).map((view: ViewConfig) => ({
              ...view,
              placeholders: (view.placeholders || []).map((p: any) => ({
                id: p.id,
                xIn: p.xIn,
                yIn: p.yIn,
                widthIn: p.widthIn ?? p.wIn ?? 6, // Migrate old wIn to widthIn
                heightIn: p.heightIn ?? p.hIn ?? 6, // Migrate old hIn to heightIn
                rotationDeg: p.rotationDeg ?? 0,
                scale: p.scale ?? 1.0,
                lockSize: p.lockSize ?? false,
                // Polygon / magnetic lasso support
                shapeType: p.shapeType, // e.g. 'polygon'
                polygonPoints: p.polygonPoints,
              })),
            }));

            setDesignData({
              views:
                migratedViews.length > 0
                  ? migratedViews
                  : [
                    { key: 'front', mockupImageUrl: '', placeholders: [] },
                    { key: 'back', mockupImageUrl: '', placeholders: [] },
                    { key: 'left', mockupImageUrl: '', placeholders: [] },
                    { key: 'right', mockupImageUrl: '', placeholders: [] },
                  ],
              sampleMockups: product.design.sampleMockups || [],
              dpi: product.design.dpi || 300,
              physicalDimensions: product.design.physicalDimensions || {
                width: DEFAULT_PHYSICAL_WIDTH,
                height: DEFAULT_PHYSICAL_HEIGHT,
                length: DEFAULT_PHYSICAL_LENGTH,
              },
              // Preserve existing displacement settings or fall back to sensible defaults
              displacementSettings:
                product.design.displacementSettings || defaultDisplacementSettings,
            });
          }

          if (product.shipping) {
            setShippingData({
              packageLengthCm: product.shipping.packageLengthCm || 0,
              packageWidthCm: product.shipping.packageWidthCm || 0,
              packageHeightCm: product.shipping.packageHeightCm || 0,
              packageWeightGrams: product.shipping.packageWeightGrams || 0,
              deliveryTimeOption: product.shipping.deliveryTimeOption || 'specific',
              inStockDeliveryTime: product.shipping.inStockDeliveryTime || '',
              outOfStockDeliveryTime: product.shipping.outOfStockDeliveryTime || '',
              additionalShippingCost: product.shipping.additionalShippingCost || 0,
              carrierSelection: product.shipping.carrierSelection || 'all',
              selectedCarriers: product.shipping.selectedCarriers || [],
            });
          }

          if (product.variants) {
            setVariants(product.variants);
          }

          if (product.availableSizes) {
            setAvailableSizes(product.availableSizes);
          }

          if (product.availableColors) {
            setAvailableColors(product.availableColors);
          }

          if (product.galleryImages) {
            setGalleryImages(product.galleryImages);
          }

          if (product.faqs) {
            setFaqs(product.faqs);
          }

          if (product.pricing) {
            setPricingData(product.pricing);
          }

          if (product.stocks) {
            setStocksData(product.stocks);
          }

          if (product.options) {
            setOptionsData(product.options);
          }
        } else {
          toast.error('Product not found');
          navigate('/admin?tab=products');
        }
      } catch (error: any) {
        console.error('Failed to fetch product:', error);
        toast.error(error.message || 'Failed to load product');
        navigate('/admin?tab=products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, id]); // navigate is stable and doesn't need to be in dependencies

  const handleCreateProduct = async () => {
    // Validation - Section A
    if (!catalogueData.name || !catalogueData.description || !catalogueData.categoryId || catalogueData.basePrice === 0) {
      toast.error('Please fill in all required catalogue fields');
      return;
    }

    // Validation - Section B
    if (availableSizes.length === 0 || availableColors.length === 0) {
      toast.error('Please select at least one size and one color');
      return;
    }

    // Validation - Section C
    const hasMockup = designData.views.some(v => v.mockupImageUrl);
    if (!hasMockup) {
      toast.error('Please upload at least one mockup image');
      return;
    }

    // Validation - Section D (Gallery Images)
    if (galleryImages.length === 0) {
      toast.error('Please upload at least one product gallery image');
      return;
    }
    const hasPrimaryImage = galleryImages.some(img => img.isPrimary);
    if (!hasPrimaryImage) {
      toast.error('Please mark one image as Primary');
      return;
    }

    // Validation - Section E (Shipping)
    if (
      shippingData.packageLengthCm === 0 ||
      shippingData.packageWidthCm === 0 ||
      shippingData.packageHeightCm === 0 ||
      shippingData.packageWeightGrams === 0
    ) {
      toast.error('Please fill in all shipping and packaging dimensions');
      return;
    }

    // Sanitize design data to ensure all placeholders have required numeric fields
    const sanitizedDesign: ProductDesignData = {
      ...designData,
      views: (designData.views || []).map((view) => ({
        ...view,
        placeholders: (view.placeholders || [])
          .map((p) => {
            let { xIn, yIn, widthIn, heightIn } = p;

            // If core fields are missing but polygon points exist, derive a bounding box from polygon
            if (
              (xIn === undefined || yIn === undefined || widthIn === undefined || heightIn === undefined) &&
              Array.isArray((p as any).polygonPoints) &&
              (p as any).polygonPoints.length >= 3
            ) {
              const pts = (p as any).polygonPoints as Array<{ xIn: number; yIn: number }>;
              const xs = pts.map((pt) => pt.xIn);
              const ys = pts.map((pt) => pt.yIn);
              const minX = Math.min(...xs);
              const maxX = Math.max(...xs);
              const minY = Math.min(...ys);
              const maxY = Math.max(...ys);

              xIn = minX;
              yIn = minY;
              widthIn = maxX - minX;
              heightIn = maxY - minY;
            }

            return {
              ...p,
              xIn,
              yIn,
              widthIn,
              heightIn,
            };
          })
          // Final safety net: drop any placeholder that still misses required coords/sizes
          .filter(
            (p) =>
              p.xIn !== undefined &&
              p.yIn !== undefined &&
              p.widthIn !== undefined &&
              p.heightIn !== undefined,
          ),
      })),
    };

    // Prepare payload
    const payload: ProductFormData = {
      catalogue: catalogueData,
      details: detailsData,
      design: sanitizedDesign,
      shipping: shippingData,
      pricing: pricingData,
      stocks: stocksData,
      options: optionsData,
      variants,
      availableSizes,
      availableColors,
      galleryImages,
      faqs: faqs.length > 0 ? faqs : undefined,
    };

    try {
      let response;
      if (isEditMode && id) {
        // Update existing product
        response = await productApi.update(id, payload) as any;
      } else {
        // Create new product
        response = await productApi.create(payload) as any;
      }

      if (response && response.success === true) {
        toast.success(response.message || (isEditMode ? 'Product updated successfully!' : 'Product created successfully!'));
        // Navigate to admin products tab to see the product
        navigate('/admin?tab=products');
      } else {
        const errorMessage = response?.message || response?.error || (isEditMode ? 'Failed to update product' : 'Failed to create product');
        toast.error(errorMessage);
        if (response?.errors && Array.isArray(response.errors)) {
          console.error('Validation errors:', response.errors);
        }
      }
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, error);
      // Try to extract error message from response
      let errorMessage = isEditMode ? 'Failed to update product. Please try again.' : 'Failed to create product. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }
      toast.error(errorMessage);
    }
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
        {isLoading ? (
          <div className="mb-6">
            <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded mb-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {isEditMode ? 'Loading product data...' : 'Preparing form...'}
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">
              {isEditMode ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isEditMode
                ? 'Update the catalogue product details'
                : 'Create a catalogue product that merchants can use in their stores'
              }
            </p>
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeStep} onValueChange={setActiveStep} className="w-full">
              <TabsList className="grid w-full grid-cols-4 md:grid-cols-10 mb-6">
                <TabsTrigger value="catalogue" className="flex items-center gap-2">
                  <span className="hidden sm:inline">1.</span> Catalogue
                </TabsTrigger>
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <span className="hidden sm:inline">2.</span> Details
                </TabsTrigger>
                <TabsTrigger value="variants" className="flex items-center gap-2">
                  <span className="hidden sm:inline">3.</span> Variants
                </TabsTrigger>
                <TabsTrigger value="design" className="flex items-center gap-2">
                  <span className="hidden sm:inline">4.</span> Design
                </TabsTrigger>
                <TabsTrigger value="sample-mockups" className="flex items-center gap-2">
                  <span className="hidden sm:inline">5.</span> Samples
                </TabsTrigger>
                <TabsTrigger value="gallery" className="flex items-center gap-2">
                  <span className="hidden sm:inline">6.</span> Gallery
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex items-center gap-2">
                  <span className="hidden sm:inline">7.</span> Pricing
                </TabsTrigger>
                <TabsTrigger value="stocks" className="flex items-center gap-2">
                  <span className="hidden sm:inline">8.</span> Stocks
                </TabsTrigger>
                <TabsTrigger value="options" className="flex items-center gap-2">
                  <span className="hidden sm:inline">9.</span> Options
                </TabsTrigger>
                <TabsTrigger value="shipping" className="flex items-center gap-2">
                  <span className="hidden sm:inline">10.</span> Shipping
                </TabsTrigger>
                <TabsTrigger value="faq" className="flex items-center gap-2">
                  <span className="hidden sm:inline">11.</span> FAQ
                </TabsTrigger>
              </TabsList>

              {/* Step 1: Product Catalogue Info */}
              <TabsContent value="catalogue" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Step 1: Product Catalogue Info</h2>
                  <p className="text-sm text-muted-foreground">
                    Store data for merchants - product name, description, category, tags, and base price
                  </p>
                </div>
                <ProductCatalogueSection
                  data={catalogueData}
                  onChange={setCatalogueData}
                />
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setActiveStep('details')}
                    className="gap-2"
                  >
                    Next: Details
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 2: Product Details */}
              <TabsContent value="details" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Step 2: Product Details</h2>
                  <p className="text-sm text-muted-foreground">
                    Enter product identification codes and barcodes (optional)
                  </p>
                </div>
                <ProductDetailsSection
                  data={detailsData}
                  onChange={setDetailsData}
                />
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep('catalogue')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setActiveStep('variants')}
                    className="gap-2"
                  >
                    Next: Variants
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 3: Product Variants */}
              <TabsContent value="variants" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Step 3: Product Variants</h2>
                  <p className="text-sm text-muted-foreground">
                    Select available sizes and colors. Variants will be auto-generated with SKUs.
                  </p>
                </div>
                <ProductVariantsSection
                  availableSizes={availableSizes}
                  availableColors={availableColors}
                  variants={variants}
                  onSizesChange={setAvailableSizes}
                  onColorsChange={setAvailableColors}
                  onVariantsChange={setVariants}
                  baseSku={catalogueData.name.toUpperCase().replace(/\s+/g, '-') || 'PROD'}
                  categoryId={catalogueData.categoryId}
                  subcategoryId={catalogueData.subcategoryIds[0]}
                />
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep('details')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setActiveStep('design')}
                    className="gap-2"
                  >
                    Next: Design
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 4: Mockup & Print Areas */}
              <TabsContent value="design" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Step 4: Mockup & Print Area Editor</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload mockup images and define print areas for each view (Front, Back, Left, Right)
                  </p>
                </div>
                <ProductImageConfigurator
                  views={designData.views}
                  onViewsChange={(views) =>
                    setDesignData((prev) => ({
                      ...prev,
                      views,
                    }))
                  }
                  // Use persisted physical dimensions so admin + designer stay in sync 1:1
                  physicalWidth={designData.physicalDimensions?.width ?? DEFAULT_PHYSICAL_WIDTH}
                  physicalHeight={designData.physicalDimensions?.height ?? DEFAULT_PHYSICAL_HEIGHT}
                  physicalLength={designData.physicalDimensions?.length ?? DEFAULT_PHYSICAL_LENGTH}
                  unit="in"
                  displacementSettings={
                    designData.displacementSettings || defaultDisplacementSettings
                  }
                  onDisplacementSettingsChange={(settings) =>
                    setDesignData((prev) => ({
                      ...prev,
                      displacementSettings: settings,
                    }))
                  }
                />
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep('variants')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setActiveStep('sample-mockups')}
                    className="gap-2"
                  >
                    Next: Samples
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 5: Sample Mockups */}
              <TabsContent value="sample-mockups" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Step 5: Sample Mockups</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload multiple sample mockups (lifestyle, flat lays) per view. These will be used to generate mockups for the user.
                  </p>
                </div>
                <UploadMockupsSection
                  sampleMockups={designData.sampleMockups || []}
                  onSampleMockupsChange={(sampleMockups) =>
                    setDesignData((prev) => ({
                      ...prev,
                      sampleMockups,
                    }))
                  }
                  physicalWidth={designData.physicalDimensions?.width ?? DEFAULT_PHYSICAL_WIDTH}
                  physicalHeight={designData.physicalDimensions?.height ?? DEFAULT_PHYSICAL_HEIGHT}
                  physicalLength={designData.physicalDimensions?.length ?? DEFAULT_PHYSICAL_LENGTH}
                  unit="in"
                />
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep('design')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setActiveStep('gallery')}
                    className="gap-2"
                  >
                    Next: Gallery
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 6: Product Gallery Images */}
              <TabsContent value="gallery" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Step 6: Product Gallery Images</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload customer-facing product images (size charts, flat shots, lifestyle photos, etc.)
                  </p>
                </div>
                <ProductGallerySection
                  images={galleryImages}
                  onChange={setGalleryImages}
                />
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep('sample-mockups')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setActiveStep('pricing')}
                    className="gap-2"
                  >
                    Next: Pricing
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 7: Pricing */}
              <TabsContent value="pricing" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Step 7: Pricing</h2>
                  <p className="text-sm text-muted-foreground">
                    Set retail prices, tax rules, cost price, and optional price per unit
                  </p>
                </div>
                <ProductPricingSection
                  data={pricingData}
                  onChange={setPricingData}
                />
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep('gallery')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setActiveStep('stocks')}
                    className="gap-2"
                  >
                    Next: Stocks
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 8: Stocks/Inventory */}
              <TabsContent value="stocks" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Step 8: Stocks & Inventory</h2>
                  <p className="text-sm text-muted-foreground">
                    Configure stock management, minimum quantities, and low stock alerts
                  </p>
                </div>
                <ProductStocksSection
                  data={stocksData}
                  onChange={setStocksData}
                />
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep('pricing')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setActiveStep('options')}
                    className="gap-2"
                  >
                    Next: Options
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 9: Product Options */}
              <TabsContent value="options" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Step 9: Product Options</h2>
                  <p className="text-sm text-muted-foreground">
                    Configure product visibility, availability, price display, and supplier associations
                  </p>
                </div>
                <ProductOptionsSection
                  data={optionsData}
                  onChange={setOptionsData}
                />
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep('stocks')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setActiveStep('shipping')}
                    className="gap-2"
                  >
                    Next: Shipping
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 10: Shipping & Packaging */}
              <TabsContent value="shipping" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Step 10: Shipping & Packaging</h2>
                  <p className="text-sm text-muted-foreground">
                    Package dimensions and weight for courier APIs and Shopify shipping
                  </p>
                </div>
                <ShippingPackagingSection
                  data={shippingData}
                  onChange={setShippingData}
                />
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep('options')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    onClick={() => setActiveStep('faq')}
                    className="gap-2"
                  >
                    Next: FAQ
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              {/* Step 10: Product FAQs */}
              <TabsContent value="faq" className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-1">Step 10: Frequently Asked Questions</h2>
                  <p className="text-sm text-muted-foreground">
                    Add common questions and answers to help customers understand the product better
                  </p>
                </div>
                <ProductFAQSection
                  faqs={faqs}
                  onChange={setFaqs}
                />
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep('shipping')}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleCreateProduct}
                    className="min-w-[200px]"
                    disabled={isLoading}
                  >
                    {isEditMode ? 'Update Product' : 'Create Product'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div >
  );
};

export default AdminProductCreation;
