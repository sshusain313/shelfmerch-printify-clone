const mongoose = require('mongoose');

/**
 * WithdrawalRequest Model
 * Tracks merchant withdrawal requests with admin approval workflow.
 * Status lifecycle: PENDING → APPROVED → PAID (or PENDING → REJECTED)
 * 
 * On APPROVED: Wallet balance is deducted atomically
 * On PAID: Admin has completed manual UPI payout
 * On REJECTED: No balance change, reason is recorded
 */
const WithdrawalRequestSchema = new mongoose.Schema(
    {
        merchantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        // Amount in smallest currency unit (paise for INR)
        amountPaise: {
            type: Number,
            required: true,
            min: 10000, // Minimum ₹100 (100 * 100 paise)
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer value',
            },
        },
        currency: {
            type: String,
            default: 'INR',
            enum: ['INR'],
        },
        // UPI ID for payout
        upiId: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: function (v) {
                    // Basic UPI ID format validation: user@provider
                    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(v);
                },
                message: '{VALUE} is not a valid UPI ID',
            },
        },
        // Status of the withdrawal request
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED', 'PAID', 'FAILED'],
            default: 'PENDING',
            index: true,
        },
        // Audit timestamps
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        reviewedAt: {
            type: Date,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        paidAt: {
            type: Date,
        },
        // Rejection information
        rejectionReason: {
            type: String,
            trim: true,
        },
        // Payout information (when status = PAID)
        payoutMethod: {
            type: String,
            default: 'UPI',
            enum: ['UPI', 'BANK_TRANSFER', 'OTHER'],
        },
        payoutReference: {
            type: String,
            trim: true,
        },
        payoutNotes: {
            type: String,
            trim: true,
        },
        // Balance snapshot at the time of request
        balanceBeforeRequestPaise: {
            type: Number,
        },
        // Link to the wallet debit transaction (created on APPROVAL)
        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WalletTransaction',
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for merchant's withdrawal history
WithdrawalRequestSchema.index({ merchantId: 1, createdAt: -1 });

// Index for admin dashboard queries
WithdrawalRequestSchema.index({ status: 1, createdAt: -1 });

// Index for finding pending requests
WithdrawalRequestSchema.index({ status: 1, merchantId: 1 });

// Virtual for amount in rupees
WithdrawalRequestSchema.virtual('amountRupees').get(function () {
    return (this.amountPaise / 100).toFixed(2);
});

// Ensure virtuals are included in JSON
WithdrawalRequestSchema.set('toJSON', { virtuals: true });
WithdrawalRequestSchema.set('toObject', { virtuals: true });

// Static method to check if merchant has pending withdrawal
WithdrawalRequestSchema.statics.hasPendingWithdrawal = async function (merchantId) {
    const count = await this.countDocuments({
        merchantId,
        status: 'PENDING',
    });
    return count > 0;
};

// Static method to get total pending amount for a merchant
WithdrawalRequestSchema.statics.getPendingAmountPaise = async function (merchantId) {
    const result = await this.aggregate([
        {
            $match: {
                merchantId: new mongoose.Types.ObjectId(merchantId),
                status: { $in: ['PENDING', 'APPROVED'] },
            },
        },
        {
            $group: {
                _id: null,
                totalPaise: { $sum: '$amountPaise' },
            },
        },
    ]);
    return result[0]?.totalPaise || 0;
};

module.exports = mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);
