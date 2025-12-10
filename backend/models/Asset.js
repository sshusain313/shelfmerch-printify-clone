const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    type: {
      type: String,
      required: true,
      enum: [
        'svg',
        'png',
        'pattern',
        'textTemplate',
        'icon',
        'shape',
        'font',
        'jpg',
        'webp',
      ],
    },
    category: {
      type: String,
      required: true,
      enum: ['graphics', 'patterns', 'textTemplates', 'icons', 'shapes', 'fonts', 'logos'],
    },
    fileUrl: {
      type: String,
      required: true,
    },
    previewUrl: {
      type: String,
    },
    svgContent: {
      type: String, // Store inline SVG for quick access
    },
    recommendedSize: {
      width: {
        type: Number,
        default: 0,
      },
      height: {
        type: Number,
        default: 0,
      },
    },
    designNotes: {
      type: String,
      default: '',
    },
    usage: {
      type: String,
      enum: ['front print', 'back print', 'sticker', 'accessory', 'all'],
      default: 'all',
    },
    license: {
      type: String,
      enum: ['commercial', 'CC0', 'royalty-free', 'custom'],
      default: 'commercial',
    },
    fileKey: {
      type: String,
      required: true, // S3 key for deletion
    },
    previewKey: {
      type: String, // S3 preview key for deletion
    },

    // MULTI-TENANCY SCOPE
    scope: {
      type: String,
      enum: ['global', 'account', 'store'],
      default: 'global',
    },
    // Optional account-level isolation (all stores of that merchant)
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    // Per-store isolation (only this store can use)
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      default: null,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },

    // Font-specific fields
    fontFamily: String,
    fontWeight: String,
    fontStyle: String,

    // Text template specific
    sampleText: String,
    textEffects: {
      stroke: Boolean,
      shadow: Boolean,
      letterSpacing: Number,
    },

    // Pattern specific
    seamless: Boolean,
    patternRepeat: String, // 'repeat', 'repeat-x', 'repeat-y', 'no-repeat'

    // Metadata
    fileSize: Number,
    mimeType: String,
    dimensions: {
      width: Number,
      height: Number,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for search and filtering
assetSchema.index({ title: 'text', description: 'text', tags: 'text' });
assetSchema.index({ category: 1, type: 1 });
assetSchema.index({ isPublished: 1 });
assetSchema.index({ tags: 1 });
assetSchema.index({ createdAt: -1 });
assetSchema.index({ scope: 1, accountId: 1, storeId: 1 }); // multi-tenant queries

// Virtual for full S3 URL if not already stored
assetSchema.virtual('fullFileUrl').get(function () {
  return this.fileUrl;
});

// Method to increment downloads
assetSchema.methods.incrementDownloads = function () {
  this.downloads += 1;
  return this.save();
};

// Method to increment views
assetSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

/**
 * Static method to search assets with tenant scoping
 *
 * options:
 *  - category, type, tags, search, page, limit, sort (existing)
 *  - accountId: ObjectId (optional)
 *  - storeId: ObjectId (optional)
 *  - includeGlobal: boolean (default true)
 */
assetSchema.statics.searchAssets = function (query, options = {}) {
  const {
    category,
    type,
    tags,
    search,
    page = 1,
    limit = 50,
    sort = '-createdAt',
    accountId = null,
    storeId = null,
    includeGlobal = true,
  } = options;

  const filter = {
    isPublished: true,
  };

  // Multi-tenant scope filter
  const scopeOr = [];

  if (includeGlobal) {
    scopeOr.push({ scope: 'global' });
  }

  if (accountId) {
    scopeOr.push({ scope: 'account', accountId });
  }

  if (storeId) {
    scopeOr.push({ scope: 'store', storeId });
  }

  if (scopeOr.length > 0) {
    filter.$or = scopeOr;
  }

  if (category) filter.category = category;
  if (type) filter.type = type;
  if (tags && tags.length > 0) filter.tags = { $in: tags };
  if (search) filter.$text = { $search: search };

  return this.find(filter)
    .sort(sort)
    .limit(limit)
    .skip((page - 1) * limit)
    .select('-svgContent') // Don't return full SVG in list
    .lean();
};

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;
