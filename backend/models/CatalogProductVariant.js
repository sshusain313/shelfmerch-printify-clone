const mongoose = require('mongoose');

const CatalogProductVariantSchema = new mongoose.Schema({
  catalogProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CatalogProduct',
    required: true,
    index: true
  },
  size: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  colorHex: {
    type: String,
    required: true
  },
  // Base SKU template (merchants can override in StoreProductVariant)
  skuTemplate: {
    type: String,
    required: true
  },
  // Optional: variant-specific base price (if different from catalog base price)
  basePrice: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Per-view base images for this variant
  viewImages: {
    front: { type: String, default: '' },
    back: { type: String, default: '' },
    left: { type: String, default: '' },
    right: { type: String, default: '' }
  }
}, {
  timestamps: true
});

// Compound index: ensure unique size+color per catalog product
CatalogProductVariantSchema.index(
  { catalogProductId: 1, size: 1, color: 1 },
  { unique: true }
);

CatalogProductVariantSchema.index({ isActive: 1 });

module.exports = mongoose.model('CatalogProductVariant', CatalogProductVariantSchema);
