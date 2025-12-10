const mongoose = require('mongoose');

const StoreProductSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  catalogProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CatalogProduct',
    required: true,
    index: true
  },
  // Optional: store-specific overrides
  title: {
    type: String, // If null, use CatalogProduct.name
    trim: true
  },
  description: {
    type: String // If null, use CatalogProduct.description
  },
  // Merchant's selling price (what customers pay)
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  // Optional: compare at price (for showing discounts)
  compareAtPrice: {
    type: Number,
    min: 0
  },
  // Store-specific gallery images (optional, falls back to catalog)
  galleryImages: [{
    id: { type: String, required: true },
    url: { type: String, required: true },
    position: { type: Number, required: true },
    isPrimary: { type: Boolean, default: false },
    imageType: { 
      type: String, 
      enum: ['lifestyle', 'flat-front', 'flat-back', 'size-chart', 'detail', 'other'],
      default: 'other'
    },
    altText: { type: String, default: '' }
  }],
  // Store-specific tags (optional)
  tags: [String],
  // Custom design and properties saved from the design editor
  designData: {
    type: Object,
  },
  // Publication status
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true
  },
  publishedAt: { type: Date },
  // Active status in this store
  isActive: {
    type: Boolean,
    default: true
  },
  // For connected stores: external product ID
  externalProductId: {
    type: String,
    sparse: true
  },
  // Last sync with external platform
  lastSyncAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index: one StoreProduct per store+catalogProduct
StoreProductSchema.index(
  { storeId: 1, catalogProductId: 1 },
  { unique: true }
);

StoreProductSchema.index({ isActive: 1 });
StoreProductSchema.index({ createdAt: -1 });

module.exports = mongoose.model('StoreProduct', StoreProductSchema);
