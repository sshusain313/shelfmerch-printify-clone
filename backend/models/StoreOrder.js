const mongoose = require('mongoose');

const StoreOrderSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StoreCustomer',
      index: true,
    },
    customerEmail: {
      type: String,
    },
    items: [
      {
        storeProductId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'StoreProduct',
        },
        productName: String,
        mockupUrl: String,
        mockupUrls: [String],
        quantity: Number,
        price: Number,
        variant: {
          color: String,
          size: String,
          sku: String,
        },
      },
    ],
    subtotal: Number,
    shipping: Number,
    tax: Number,
    total: Number,
    status: {
      type: String,
      enum: ['on-hold', 'paid', 'in-production', 'shipped', 'delivered', 'fulfilled', 'cancelled', 'refunded'],
      default: 'on-hold',
      index: true,
    },
    shippingAddress: {
      fullName: String,
      email: String,
      phone: String,
      address1: String,
      address2: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    providerOrders: [
      {
        providerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Provider',
        },
        providerOrderId: String,
        status: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

StoreOrderSchema.index({ storeId: 1, createdAt: -1 });
StoreOrderSchema.index({ merchantId: 1, createdAt: -1 });

module.exports = mongoose.model('StoreOrder', StoreOrderSchema);
