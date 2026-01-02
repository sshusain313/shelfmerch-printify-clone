const mongoose = require('mongoose');
const { isValidCategory } = require('../config/productCategories');

const PlaceholderSchema = new mongoose.Schema({
  id: { type: String, required: true },
  xIn: { type: Number, required: true },
  yIn: { type: Number, required: true },
  widthIn: { type: Number },
  heightIn: { type: Number },
  rotationDeg: { type: Number, default: 0 },
  scale: { type: Number, default: 1.0 },
  lockSize: { type: Boolean, default: false },
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
  // Store URL, not base64!
  mockupImageUrl: { type: String, required: true },
  placeholders: { type: [PlaceholderSchema], default: [] }
}, { _id: false });

const SampleMockupImageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  viewKey: {
    type: String,
    required: true,
    enum: ['front', 'back', 'left', 'right']
  },
  colorKey: { type: String, default: '' }, // Color this mockup is for (e.g., "Olive")
  imageUrl: { type: String, required: true }, // Store URL, not base64!
  placeholders: { type: [PlaceholderSchema], default: [] },
  // Per-mockup displacement settings for WebGL previews
  displacementSettings: {
    scaleX: { type: Number, default: 20 },
    scaleY: { type: Number, default: 20 },
    contrastBoost: { type: Number, default: 1.5 }
  },
  metadata: {
    imageType: {
      type: String,
      enum: ['lifestyle', 'flat-front', 'flat-back', 'folded', 'person', 'detail', 'other'],
      default: 'other'
    },
    caption: { type: String, default: '' },
    order: { type: Number, default: 0 }
  }
}, { _id: false });

const CatalogProductDesignSchema = new mongoose.Schema({
  views: [ViewConfigSchema],
  sampleMockups: { type: [SampleMockupImageSchema], default: [] },
  dpi: { type: Number, default: 300 },
  physicalDimensions: {
    width: { type: Number },
    height: { type: Number },
    length: { type: Number }
  },
  displacementSettings: {
    scaleX: { type: Number, default: 20 },
    scaleY: { type: Number, default: 20 },
    contrastBoost: { type: Number, default: 1.5 }
  }
}, { _id: false });

const CatalogProductShippingSchema = new mongoose.Schema({
  packageLengthCm: { type: Number, required: true },
  packageWidthCm: { type: Number, required: true },
  packageHeightCm: { type: Number, required: true },
  packageWeightGrams: { type: Number, required: true },
  deliveryTimeOption: {
    type: String,
    enum: ['none', 'default', 'specific'],
    default: 'specific'
  },
  inStockDeliveryTime: { type: String, default: '' },
  outOfStockDeliveryTime: { type: String, default: '' },
  additionalShippingCost: { type: Number, default: 0 },
  carrierSelection: {
    type: String,
    enum: ['all', 'selected'],
    default: 'all'
  },
  selectedCarriers: { type: [String], default: [] }
}, { _id: false });

const CatalogProductGalleryImageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  url: { type: String, required: true }, // URL, not base64
  position: { type: Number, required: true },
  isPrimary: { type: Boolean, default: false },
  imageType: {
    type: String,
    enum: ['lifestyle', 'flat-front', 'flat-back', 'size-chart', 'detail', 'other'],
    default: 'other'
  },
  altText: { type: String, default: '' }
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

const CatalogProductSchema = new mongoose.Schema({
  // Basic info
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  categoryId: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return isValidCategory(v);
      },
      message: props => `${props.value} is not a valid category ID`
    }
  },
  subcategoryIds: [String],
  productTypeCode: {
    type: String,
    required: true
  },
  tags: [String],

  // Attributes (dynamic fields from CatalogueFieldTemplate)
  attributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Base price (what manufacturer charges)
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },

  // GST Settings
  gst: {
    slab: { type: Number, enum: [0, 5, 12, 18], default: 18 },
    mode: { type: String, enum: ['EXCLUSIVE', 'INCLUSIVE'], default: 'EXCLUSIVE' },
    hsn: { type: String, default: '' }
  },

  // Design (mockups, placeholders)
  design: {
    type: CatalogProductDesignSchema,
    required: true
  },

  // Shipping specs
  shipping: {
    type: CatalogProductShippingSchema,
    required: true
  },

  // Gallery images
  galleryImages: [CatalogProductGalleryImageSchema],

  // Pricing (including specific prices)
  pricing: {
    type: ProductPricingSchema,
    default: () => ({})
  },

  // Product details (barcodes, etc.)
  details: {
    mpn: { type: String, default: '' },
    upc: { type: String, default: '' },
    ean13: { type: String, default: '' },
    isbn: { type: String, default: '' }
  },

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
  isPublished: {
    type: Boolean,
    default: false // SUPERADMIN must publish to make available to merchants
  }
}, {
  timestamps: true
});

// Indexes
CatalogProductSchema.index({ name: 'text', description: 'text' });
CatalogProductSchema.index({ createdBy: 1 });
CatalogProductSchema.index({ isActive: 1, isPublished: 1 });
CatalogProductSchema.index({ createdAt: -1 });
CatalogProductSchema.index({ categoryId: 1 });
CatalogProductSchema.index({ productTypeCode: 1 });

module.exports = mongoose.model('CatalogProduct', CatalogProductSchema);
