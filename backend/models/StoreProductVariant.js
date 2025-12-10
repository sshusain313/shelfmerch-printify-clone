const mongoose = require('mongoose');

const StoreProductVariantSchema = new mongoose.Schema({
  storeProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreProduct',
    required: true,
    index: true
  },
  catalogProductVariantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CatalogProductVariant',
    required: true,
    index: true
  },
  // Store-specific SKU
  sku: {
    type: String,
    required: true
  },
  // Optional: variant-specific price (if different from StoreProduct.sellingPrice)
  sellingPrice: {
    type: Number,
    min: 0
  },
  // Active status in this store
  isActive: {
    type: Boolean,
    default: true
  },
  // For connected stores: external variant ID
  externalVariantId: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true
});

// Compound index: one StoreProductVariant per storeProduct+catalogVariant
StoreProductVariantSchema.index(
  { storeProductId: 1, catalogProductVariantId: 1 },
  { unique: true }
);

StoreProductVariantSchema.index({ isActive: 1 });

module.exports = mongoose.model('StoreProductVariant', StoreProductVariantSchema);
