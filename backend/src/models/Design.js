const mongoose = require('mongoose');

const designSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      default: 'Untitled Design',
    },
    designData: {
      canvas: {
        width: Number,
        height: Number,
        backgroundColor: String,
        view: {
          type: String,
          enum: ['front', 'back', 'sleeve'],
          default: 'front',
        },
      },
      elements: [
        {
          id: String,
          type: {
            type: String,
            enum: ['text', 'image', 'shape'],
          },
          // Text-specific fields
          content: String,
          fontFamily: String,
          fontSize: Number,
          fontWeight: String,
          fontStyle: String,
          textDecoration: String,
          color: String,
          textAlign: String,
          lineHeight: Number,
          letterSpacing: Number,
          // Image-specific fields
          url: String,
          originalUrl: String,
          filters: mongoose.Schema.Types.Mixed,
          // Shape-specific
          shapeType: String,
          fill: String,
          stroke: String,
          strokeWidth: Number,
          // Common transform properties
          x: Number,
          y: Number,
          width: Number,
          height: Number,
          rotation: Number,
          scaleX: Number,
          scaleY: Number,
          opacity: Number,
          zIndex: Number,
          locked: Boolean,
          visible: Boolean,
        },
      ],
    },
    mockupUrls: {
      front: String,
      back: String,
      preview: String,
      highRes: String,
    },
    printFiles: {
      front: String,
      back: String,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    publishedProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Design', designSchema);
