const mongoose = require('mongoose');
const { isValidCategory } = require('../config/productCategories');

const PlaceholderSchema = new mongoose.Schema({
  id: { type: String, required: true },
  xIn: { type: Number, required: true },
  yIn: { type: Number, required: true },
  // Legacy fields (for backward compatibility)
  wIn: { type: Number },
  hIn: { type: Number },
  // New fields (source of truth for print dimensions)
  widthIn: { type: Number }, // Real print width in inches
  heightIn: { type: Number }, // Real print height in inches
  rotationDeg: { type: Number, default: 0 },
  scale: { type: Number, default: 1.0 }, // Visual scale multiplier
  lockSize: { type: Boolean, default: false }, // Lock print size flag
  // Polygon / magnetic lasso support
  shapeType: { type: String, enum: ['rect', 'polygon'], default: 'rect' },
  polygonPoints: {
    type: [{
      xIn: { type: Number, required: true },
      yIn: { type: Number, required: true },
    }],
    default: undefined,
  },
}, { _id: false });

const ViewConfigSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    enum: ['front', 'back', 'left', 'right'] 
  },
  mockupImageUrl: { type: String, default: '' },
  placeholders: { type: [PlaceholderSchema], default: [] },
}, { _id: false });

// ProductVariant schema moved to separate collection (ProductVariant.js)
// Variants are now stored in their own collection and linked by productId

const ProductGalleryImageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  url: { type: String, required: true },
  position: { type: Number, required: true },
  isPrimary: { type: Boolean, default: false },
  imageType: { 
    type: String, 
    enum: ['lifestyle', 'flat-front', 'flat-back', 'size-chart', 'detail', 'other'],
    default: 'other'
  },
  altText: { type: String, default: '' },
}, { _id: false });

const ProductFAQSchema = new mongoose.Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  order: { type: Number, required: true, default: 0 },
}, { _id: false });

const ProductCatalogueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  categoryId: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return isValidCategory(v);
      },
      message: props => `${props.value} is not a valid category ID. Must be one of: apparel, accessories, home, print, packaging, tech, jewelry`
    }
  },
  subcategoryIds: [String],
  basePrice: { type: Number, required: true },
  tags: [String],
  productTypeCode: { 
    type: String, 
    required: true 
  }, // e.g. "TSHIRT", "MUG", "CAP", "NOTEBOOK"
  attributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

const ProductDesignSchema = new mongoose.Schema({
  views: [ViewConfigSchema],
  dpi: { type: Number, default: 300 },
  // Optional physical dimensions of the printable product area (in inches)
  physicalDimensions: {
    width: { type: Number },   // Total printable width in inches (e.g. garment width)
    height: { type: Number },  // Total printable height in inches
    length: { type: Number },  // Optional length/depth for left/right views
  },
}, { _id: false });

const ProductShippingSchema = new mongoose.Schema({
  packageLengthCm: { type: Number, required: true },
  packageWidthCm: { type: Number, required: true },
  packageHeightCm: { type: Number, required: true },
  packageWeightGrams: { type: Number, required: true },
  // Delivery time options
  deliveryTimeOption: { 
    type: String, 
    enum: ['none', 'default', 'specific'],
    default: 'specific'
  },
  inStockDeliveryTime: { type: String, default: '' },
  outOfStockDeliveryTime: { type: String, default: '' },
  // Shipping fees
  additionalShippingCost: { type: Number, default: 0 },
  // Carrier selection
  carrierSelection: { 
    type: String, 
    enum: ['all', 'selected'],
    default: 'all'
  },
  selectedCarriers: { type: [String], default: [] },
}, { _id: false });

const ProductDetailsSchema = new mongoose.Schema({
  mpn: { type: String, default: '' }, // Manufacturer Part Number
  upc: { type: String, default: '' }, // UPC barcode
  ean13: { type: String, default: '' }, // EAN-13 or JAN barcode
  isbn: { type: String, default: '' }, // ISBN
}, { _id: false });

const SpecificPriceSchema = new mongoose.Schema({
  id: { type: String, required: true },
  combination: { type: String, default: 'All combinations' },
  currency: { type: String, default: 'All currencies' },
  country: { type: String, default: 'All countries' },
  group: { type: String, default: 'All groups' },
  store: { type: String, default: 'All stores' },
  customer: { type: String, default: '' },
  applyToAllCustomers: { type: Boolean, default: true },
  minQuantity: { type: Number, default: 1 },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  isUnlimited: { type: Boolean, default: false },
  useDiscount: { type: Boolean, default: false },
  discountValue: { type: Number, default: 0 },
  discountType: { type: String, enum: ['amount', 'percentage'], default: 'percentage' },
  discountTaxMode: { type: String, enum: ['tax_included', 'tax_excluded'], default: 'tax_excluded' },
  useSpecificPrice: { type: Boolean, default: false },
  specificPriceTaxExcl: { type: Number, default: 0 },
  specificPriceTaxIncl: { type: Number },
  discountTaxIncl: { type: Number },
}, { _id: false });

const ProductPricingSchema = new mongoose.Schema({
  retailPriceTaxExcl: { type: Number, default: 0 },
  taxRule: { type: String, default: '' },
  taxRate: { type: Number, default: 0 },
  retailPriceTaxIncl: { type: Number, default: 0 },
  costPriceTaxExcl: { type: Number, default: 0 },
  specificPrices: { type: [SpecificPriceSchema], default: [] },
}, { _id: false });

const ProductStocksSchema = new mongoose.Schema({
  minimumQuantity: { type: Number, default: 1 },
  stockLocation: { type: String, default: '' },
  lowStockAlertEnabled: { type: Boolean, default: false },
  lowStockAlertEmail: { type: String, default: '' },
  lowStockThreshold: { type: Number, default: 10 },
  outOfStockBehavior: { 
    type: String, 
    enum: ['deny', 'allow', 'default'],
    default: 'default'
  },
  currentStock: { type: Number },
}, { _id: false });

const ProductOptionsSchema = new mongoose.Schema({
  visibility: {
    type: String,
    enum: ['everywhere', 'catalog', 'search', 'nowhere'],
    default: 'everywhere'
  },
  availableForOrder: { type: Boolean, default: true },
  showPrice: { type: Boolean, default: true },
  webOnly: { type: Boolean, default: false },
  suppliers: { type: [String], default: [] },
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  // Catalogue data
  catalogue: { type: ProductCatalogueSchema, required: true },
  
  // Details data (barcode and identification) (optional)
  details: { type: ProductDetailsSchema },
  
  // Design data (mockup + print areas)
  design: { type: ProductDesignSchema, required: true },
  
  // Shipping data
  shipping: { type: ProductShippingSchema, required: true },
  
  // Pricing data (optional)
  pricing: { type: ProductPricingSchema },
  
  // Stocks/Inventory data (optional)
  stocks: { type: ProductStocksSchema },
  
  // Product Options/Settings data (optional)
  options: { type: ProductOptionsSchema },
  
  // Variants (now stored in separate collection - ProductVariant)
  // Query variants using: ProductVariant.find({ productId: product._id })
  availableSizes: [String],
  availableColors: [String],
  
  // Gallery images
  galleryImages: [ProductGalleryImageSchema],
  
  // FAQs (Frequently Asked Questions)
  faqs: [ProductFAQSchema],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ProductSchema.index({ 'catalogue.name': 'text', 'catalogue.description': 'text' });
ProductSchema.index({ createdBy: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ 'catalogue.categoryId': 1 });
ProductSchema.index({ 'catalogue.productTypeCode': 1 });

module.exports = mongoose.model('Product', ProductSchema);

