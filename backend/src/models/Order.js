const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
    customerId: String,
    customerEmail: {
      type: String,
      required: true,
    },
    items: [
      {
        productId: String,
        productName: String,
        mockupUrl: String,
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        variant: {
          color: String,
          size: String,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['on-hold', 'in-production', 'shipped', 'delivered', 'canceled'],
      default: 'on-hold',
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
    trackingNumber: String,
    notes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
