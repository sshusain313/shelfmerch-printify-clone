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
    // Payment information
    payment: {
      method: {
        type: String,
        enum: ['razorpay', 'cod', 'other'],
      },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
    },
    // Merchant Fulfillment Payment
    fulfillmentPayment: {
      status: {
        type: String,
        enum: ['PAYMENT_PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'PAYMENT_PENDING'
      },
      walletAppliedPaise: {
        type: Number,
        default: 0,
        validate: {
          validator: Number.isInteger,
          message: '{VALUE} is not an integer value'
        }
      },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      totalAmountPaise: {
        type: Number,
        validate: {
          validator: Number.isInteger,
          message: '{VALUE} is not an integer value'
        }
      }
    },
  },
  {
    timestamps: true,
  }
);

StoreOrderSchema.index({ storeId: 1, createdAt: -1 });
StoreOrderSchema.index({ merchantId: 1, createdAt: -1 });

module.exports = mongoose.model('StoreOrder', StoreOrderSchema);
