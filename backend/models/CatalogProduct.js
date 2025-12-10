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

const CatalogProductDesignSchema = new mongoose.Schema({
  views: [ViewConfigSchema],
  dpi: { type: Number, default: 300 },
  physicalDimensions: {
    width: { type: Number },
    height: { type: Number },
    length: { type: Number }
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

const CatalogProductFAQSchema = new mongoose.Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  order: { type: Number, required: true, default: 0 }
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
      validator: function(v) {
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
  
  // FAQs
  faqs: [CatalogProductFAQSchema],
  
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
