export type ViewKey = 'front' | 'back' | 'left' | 'right';

// Print placeholder stored in INCHES (design data)
export interface Placeholder {
  id: string;
  xIn: number; // X position in inches (for rectangular placeholders, or bounding box for polygons)
  yIn: number; // Y position in inches (for rectangular placeholders, or bounding box for polygons)
  widthIn: number; // Real print width in inches (source of truth) - for rectangles, or bounding box width for polygons
  heightIn: number; // Real print height in inches (source of truth) - for rectangles, or bounding box height for polygons
  rotationDeg: number; // Rotation in degrees
  scale?: number; // Visual scale multiplier (default: 1.0) - for display only
  lockSize?: boolean; // If true, dragging handles only changes scale, not widthIn/heightIn
  // For polygon/magnetic lasso placeholders
  polygonPoints?: Array<{ xIn: number; yIn: number }>; // Polygon points in inches (relative to xIn, yIn or absolute)
  shapeType?: 'rect' | 'polygon'; // Shape type: rectangle (default) or polygon (from magnetic lasso)
  // Shape refinement for polygons (curved/smoothed rendering)
  renderPolygonPoints?: Array<{ xIn: number; yIn: number }>; // Computed smoothed/curved points for rendering (in inches)
  shapeRefinement?: {
    smoothness: number; // 0-100: how smooth the curve is (0 = original polygon, 100 = very smooth)
    bulgeStrength: number; // 0-100: how much to exaggerate convex regions (0 = neutral, 100 = strong bulge)
    roundCorners: number; // 0-100: how much to round sharp corners (0 = sharp, 100 = very rounded)
  };
}

export interface ViewConfig {
  key: ViewKey;
  mockupImageUrl: string;
  placeholders: Placeholder[];
}

// WebGL displacement settings used for realistic fabric previews
export interface DisplacementSettings {
  scaleX: number; // 0-100, horizontal displacement strength
  scaleY: number; // 0-100, vertical displacement strength
  contrastBoost: number; // 1.0-5.0, fold intensity for displacement map generation
}

// Product Variant (size × color combination)
export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  colorHex?: string;
  sku: string;
  price?: number; // Optional price for this variant
  isActive: boolean;
}

// SECTION A: Product Catalogue Info (Store Data)
export interface ProductCatalogueData {
  name: string;
  description: string;
  categoryId: string;
  subcategoryIds: string[];
  basePrice: number; // Base price for the product
  tags: string[];
  productTypeCode: string; // e.g., "TSHIRT", "MUG", "CAP", "NOTEBOOK"
  attributes: Record<string, any>; // Dynamic attributes based on category/subcategory
}

// Sample Mockup Image (for multiple mockups per view)
export interface SampleMockupImage {
  id: string;
  viewKey: ViewKey;
  imageUrl: string; // Uploaded to S3
  placeholders: Placeholder[]; // Same Placeholder type as Design Section
  metadata?: {
    imageType?: 'lifestyle' | 'flat-front' | 'flat-back' | 'folded' | 'person' | 'detail' | 'other';
    caption?: string;
    order?: number;
  };
}

// SECTION B: Mockup + Print Area Editor (Design Data)
export interface ProductDesignData {
  views: ViewConfig[];
  sampleMockups?: SampleMockupImage[]; // Multiple sample mockups per view
  dpi?: number; // DPI for print-ready file generation (default: 300)
  // Optional physical dimensions of the product's printable area (in inches)
  physicalDimensions?: {
    width: number;   // Total width in inches (e.g. garment width)
    height: number;  // Total height in inches
    length?: number; // Optional length/depth for left/right views
  };
  // Optional WebGL displacement settings for realistic fabric previews
  displacementSettings?: DisplacementSettings;
}

// SECTION C: Shipping / Packaging (Logistics Data)
export interface ProductShippingData {
  packageLengthCm: number; // Package length in cm (depth)
  packageWidthCm: number; // Package width in cm
  packageHeightCm: number; // Package height in cm
  packageWeightGrams: number; // Package weight in grams
  // Delivery time options
  deliveryTimeOption?: 'none' | 'default' | 'specific';
  inStockDeliveryTime?: string; // Delivery time for in-stock products
  outOfStockDeliveryTime?: string; // Delivery time for out-of-stock products
  // Shipping fees
  additionalShippingCost?: number; // Additional shipping costs
  // Carrier selection
  carrierSelection?: 'all' | 'selected';
  selectedCarriers?: string[]; // List of selected carrier names
}

// SECTION C1: Product Details (Barcode and Identification)
export interface ProductDetailsData {
  mpn?: string; // Manufacturer Part Number
  upc?: string; // UPC barcode
  ean13?: string; // EAN-13 or JAN barcode
  isbn?: string; // ISBN
}

// Specific Price / Bulk Discount Rule
export interface SpecificPrice {
  id: string; // Unique ID for the rule
  combination?: string; // Product variant combination (default: "All combinations")
  currency: string; // Currency code (default: "All currencies")
  country: string; // Country code (default: "All countries")
  group: string; // Customer group (default: "All groups")
  store: string; // Store identifier (default: "All stores")
  customer?: string; // Specific customer ID/email (empty = all customers)
  applyToAllCustomers: boolean; // Toggle for all customers
  minQuantity: number; // Minimum units required for this price (default: 1)
  startDate?: string; // Start date (YYYY-MM-DD) or null for unlimited
  endDate?: string; // End date (YYYY-MM-DD) or null for unlimited
  isUnlimited: boolean; // Unlimited duration toggle
  // Impact on price (one must be active)
  useDiscount: boolean; // Apply discount to initial price
  discountValue?: number; // Discount amount or percentage
  discountType?: 'amount' | 'percentage'; // Discount type
  discountTaxMode?: 'tax_included' | 'tax_excluded'; // Tax mode for discount
  useSpecificPrice: boolean; // Set specific fixed price
  specificPriceTaxExcl?: number; // Specific price (tax excl.)
  // Calculated fields
  specificPriceTaxIncl?: number; // Calculated from specificPriceTaxExcl + tax
  discountTaxIncl?: number; // Calculated discount with tax
}

// SECTION D: Pricing Data
export interface ProductPricingData {
  retailPriceTaxExcl: number; // Retail price excluding tax
  taxRule: string; // Tax rule identifier (e.g., "12% GST Rate Slab")
  taxRate: number; // Tax rate percentage (e.g., 12)
  retailPriceTaxIncl: number; // Retail price including tax (auto-calculated)
  costPriceTaxExcl: number; // Cost price excluding tax
  specificPrices?: SpecificPrice[]; // Array of specific price rules
}

// SECTION E: Stocks / Inventory Data
export interface ProductStocksData {
  minimumQuantity: number; // Minimum quantity for sale
  stockLocation?: string; // Stock location/warehouse
  lowStockAlertEnabled: boolean; // Enable low stock email alerts
  lowStockAlertEmail?: string; // Email for low stock alerts
  lowStockThreshold?: number; // Quantity threshold for low stock alert
  outOfStockBehavior: 'deny' | 'allow' | 'default'; // Behavior when out of stock
  currentStock?: number; // Current stock quantity (optional, may be managed separately)
}

// SECTION F: Product Options / Settings
export interface ProductOptionsData {
  visibility: 'everywhere' | 'catalog' | 'search' | 'nowhere'; // Where product appears
  availableForOrder: boolean; // Available for order
  showPrice: boolean; // Show price to customers
  webOnly: boolean; // Not sold in retail store (web only)
  suppliers?: string[]; // Associated supplier IDs or names
}

// Product Gallery Image (Customer-facing display images)
export interface ProductGalleryImage {
  id: string;
  url: string; // Image URL (base64 or uploaded URL)
  position: number; // Display order (0, 1, 2, ...)
  isPrimary: boolean; // Only one image can be primary per product
  imageType?: 'lifestyle' | 'flat-front' | 'flat-back' | 'size-chart' | 'detail' | 'other'; // Image type label
  altText?: string; // Alt text for accessibility
}

// Product FAQ (Frequently Asked Questions)
export interface ProductFAQ {
  id: string;
  question: string;
  answer: string;
  order: number; // Display order (0, 1, 2, ...)
}

// Complete Product Form Data
export interface ProductFormData {
  // Section A: Catalogue
  catalogue: ProductCatalogueData;
  // Section B: Details
  details?: ProductDetailsData;
  // Section C: Design
  design: ProductDesignData;
  // Section D: Shipping
  shipping: ProductShippingData;
  // Section E: Pricing
  pricing?: ProductPricingData;
  // Section F: Stocks
  stocks?: ProductStocksData;
  // Section G: Options
  options?: ProductOptionsData;
  // Variants (auto-generated from sizes × colors)
  variants: ProductVariant[];
  // Available sizes and colors
  availableSizes: string[];
  availableColors: string[];
  // Product Gallery Images (customer-facing display images)
  galleryImages: ProductGalleryImage[];
  // Product FAQs (Frequently Asked Questions)
  faqs?: ProductFAQ[];
}

