const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens']
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['native', 'shopify', 'etsy', 'woocommerce'],
    default: 'native',
    required: true
  },
  // Optional basic branding fields
  description: {
    type: String,
  },
  theme: {
    type: String,
    default: 'modern',
  },
  // For connected stores (Shopify/Etsy/WooCommerce)
  externalStoreId: {
    type: String, // Store ID from external platform
    sparse: true // Only required for connected stores
  },
  externalStoreName: {
    type: String // Store name from external platform
  },
  // API credentials for connected stores (encrypted in production)
  apiCredentials: {
    apiKey: { type: String, select: false },
    apiSecret: { type: String, select: false },
    accessToken: { type: String, select: false },
    webhookUrl: { type: String }
  },
  // Store settings
  settings: {
    currency: { type: String, default: 'USD' },
    timezone: { type: String, default: 'UTC' },
    logoUrl: { type: String },
    faviconUrl: { type: String },
    primaryColor: { type: String, default: '#000000' },
    // Shipping defaults
    defaultShippingCost: { type: Number, default: 0 },
    freeShippingThreshold: { type: Number },
    // Tax settings
    taxEnabled: { type: Boolean, default: false },
    taxRate: { type: Number, default: 0 }
  },
  // Domain/subdomain for native stores
  domain: {
    type: String,
    sparse: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isConnected: {
    type: Boolean,
    default: false // For connected stores, true when API is working
  },
  lastSyncAt: {
    type: Date // Last sync with external platform
  }
}, {
  timestamps: true
});

// Indexes
storeSchema.index({ merchant: 1, isActive: 1 });
storeSchema.index({ slug: 1 });
storeSchema.index({ type: 1, isConnected: 1 });

module.exports = mongoose.model('Store', storeSchema);
