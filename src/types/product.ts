export type ViewKey = 'front' | 'back' | 'left' | 'right';

// Print placeholder stored in INCHES (design data)
export interface Placeholder {
  id: string;
  xIn: number; // X position in inches
  yIn: number; // Y position in inches
  widthIn: number; // Real print width in inches (source of truth)
  heightIn: number; // Real print height in inches (source of truth)
  rotationDeg: number; // Rotation in degrees
  scale?: number; // Visual scale multiplier (default: 1.0) - for display only
  lockSize?: boolean; // If true, dragging handles only changes scale, not widthIn/heightIn
}

export interface ViewConfig {
  key: ViewKey;
  mockupImageUrl: string;
  placeholders: Placeholder[];
}

// Product Variant (size × color combination)
export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
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

// SECTION B: Mockup + Print Area Editor (Design Data)
export interface ProductDesignData {
  views: ViewConfig[];
  dpi?: number; // DPI for print-ready file generation (default: 300)
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

