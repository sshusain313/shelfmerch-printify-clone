const mongoose = require('mongoose');

/**
 * Wallet Model
 * Represents a user's prepaid store credit wallet.
 * One wallet per user (global, not per-store).
 * Balance stored in paise (integer) to avoid floating point issues.
 */
const WalletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        currency: {
            type: String,
            default: 'INR',
            enum: ['INR', 'USD'],
        },
        // Balance in smallest currency unit (paise for INR, cents for USD)
        balancePaise: {
            type: Number,
            default: 0,
            min: 0,
            validate: {
                validator: Number.isInteger,
                message: '{VALUE} is not an integer value',
            },
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'LOCKED'],
            default: 'ACTIVE',
        },
    },
    {
        timestamps: true,
    }
);

// Ensure userId is unique at index level
WalletSchema.index({ userId: 1 }, { unique: true });

// Method to check if wallet has sufficient balance
WalletSchema.methods.hasSufficientBalance = function (amountPaise) {
    return this.status === 'ACTIVE' && this.balancePaise >= amountPaise;
};

// Method to get balance in rupees (display purposes)
WalletSchema.methods.getBalanceInRupees = function () {
    return (this.balancePaise / 100).toFixed(2);
};

module.exports = mongoose.model('Wallet', WalletSchema);
