const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    baseProduct: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: 0,
    },
    compareAtPrice: {
      type: Number,
      min: 0,
    },
    mockupUrl: String,
    designs: {
      front: String,
      back: String,
    },
    variants: {
      colors: [String],
      sizes: [String],
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
