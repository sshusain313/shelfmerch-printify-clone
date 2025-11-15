const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    storeName: {
      type: String,
      required: [true, 'Please add a store name'],
      trim: true,
    },
    subdomain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    theme: {
      type: String,
      enum: ['modern', 'classic', 'minimal'],
      default: 'modern',
    },
    description: String,
    logo: String,
    productIds: [String],
    settings: {
      primaryColor: String,
      accentColor: String,
    },
    useBuilder: {
      type: Boolean,
      default: false,
    },
    builder: {
      version: String,
      pages: [
        {
          id: String,
          name: String,
          slug: String,
          isSystemPage: Boolean,
          sections: [
            {
              id: String,
              type: String,
              order: Number,
              visible: Boolean,
              settings: mongoose.Schema.Types.Mixed,
              styles: mongoose.Schema.Types.Mixed,
            },
          ],
        },
      ],
      activePageId: String,
      globalStyles: mongoose.Schema.Types.Mixed,
      customCSS: String,
      draft: Boolean,
      lastSaved: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Store', storeSchema);
