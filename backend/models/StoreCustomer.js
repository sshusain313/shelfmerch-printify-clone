const mongoose = require('mongoose');

const StoreCustomerSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: {
      type: String,
      index: true,
    },
    name: {
      type: String,
    },
    passwordHash: {
      type: String,
    },
    googleId: {
      type: String,
      sparse: true, // Allow multiple null values
    },
    avatar: {
      type: String,
    },
    lastSeenAt: {
      type: Date,
    },
    marketingOptIn: {
      type: Boolean,
      default: false,
    },
    passwordResetOTP: {
      type: String,
      select: false, // Don't include in queries by default
    },
    passwordResetOTPExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

StoreCustomerSchema.index({ storeId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('StoreCustomer', StoreCustomerSchema);
