const mongoose = require('mongoose');

/**
 * WalletTransaction Model
 * Immutable ledger for all wallet balance changes.
 * Every credit/debit must create a transaction record.
 * idempotencyKey ensures webhook/operation safety.
 */
const WalletTransactionSchema = new mongoose.Schema(
    {
        walletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Wallet',
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        // Transaction type
        type: {
            type: String,
            enum: ['TOPUP', 'DEBIT', 'REFUND', 'ADJUSTMENT', 'WITHDRAWAL'],
            required: true,
        },
        // Direction of money flow
        direction: {
            type: String,
            enum: ['CREDIT', 'DEBIT'],
            required: true,
        },
        // Amount in paise (always positive)
        amountPaise: {
            type: Number,
            required: true,
            min: 1,
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer value',
            },
        },
        // Balance before this transaction
        balanceBeforePaise: {
            type: Number,
            validate: {
                validator: function (v) {
                    return v === undefined || v === null || Number.isInteger(v);
                },
                message: '{VALUE} is not an integer value',
            },
        },
        // Balance after this transaction
        balanceAfterPaise: {
            type: Number,
            validate: {
                validator: function (v) {
                    return v === undefined || v === null || Number.isInteger(v);
                },
                message: '{VALUE} is not an integer value',
            },
        },
        // Transaction status
        status: {
            type: String,
            enum: ['PENDING', 'SUCCESS', 'FAILED'],
            default: 'PENDING',
        },
        // Source of the transaction
        source: {
            type: String,
            enum: ['RAZORPAY', 'ORDER', 'ADMIN', 'SYSTEM'],
            required: true,
        },
        // Reference type for tracking
        referenceType: {
            type: String,
            enum: ['RAZORPAY_ORDER', 'RAZORPAY_PAYMENT', 'INVOICE', 'ORDER', 'ADMIN_ADJUSTMENT', 'WITHDRAWAL_REQUEST'],
            required: true,
        },
        // External reference ID (razorpay order id, invoice id, etc.)
        referenceId: {
            type: String,
            required: true,
            index: true,
        },
        // Unique key for idempotency (prevents duplicate processing)
        idempotencyKey: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        // Additional metadata
        meta: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        // Description for display
        description: {
            type: String,
            default: '',
        },
        // Admin who made the adjustment (if applicable)
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        // Related invoice (if payment)
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FulfillmentInvoice',
        },
        // Completed timestamp (when status changed to SUCCESS)
        completedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for user's transaction history (newest first)
WalletTransactionSchema.index({ userId: 1, createdAt: -1 });

// Index for finding by reference
WalletTransactionSchema.index({ referenceType: 1, referenceId: 1 });

// Unique index on idempotencyKey (already set in field, but explicit)
WalletTransactionSchema.index({ idempotencyKey: 1 }, { unique: true });

// Static method to find by idempotency key
WalletTransactionSchema.statics.findByIdempotencyKey = function (key) {
    return this.findOne({ idempotencyKey: key });
};

// Method to mark as successful
WalletTransactionSchema.methods.markSuccess = function (balanceBefore, balanceAfter) {
    this.status = 'SUCCESS';
    this.balanceBeforePaise = balanceBefore;
    this.balanceAfterPaise = balanceAfter;
    this.completedAt = new Date();
    return this.save();
};

// Method to mark as failed
WalletTransactionSchema.methods.markFailed = function (reason) {
    this.status = 'FAILED';
    this.meta = { ...this.meta, failureReason: reason };
    return this.save();
};

module.exports = mongoose.model('WalletTransaction', WalletTransactionSchema);
