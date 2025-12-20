const mongoose = require('mongoose');

const FulfillmentInvoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: {
            type: String,
            unique: true,
            required: true,
        },
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
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StoreOrder',
            required: true,
            unique: true, // One fulfillment invoice per order
            index: true,
        },
        items: [
            {
                productName: String,
                quantity: Number,
                productionCost: Number, // Cost from CatalogProduct.pricing.costPriceTaxExcl
                variant: {
                    color: String,
                    size: String,
                },
            },
        ],
        productionCost: {
            type: Number,
            required: true,
        },
        shippingCost: {
            type: Number,
            required: true,
        },
        tax: {
            type: Number,
            default: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'cancelled'],
            default: 'pending',
            index: true,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        paidAt: Date,
        paymentDetails: {
            transactionId: String,
            method: String,
        },
    },
    {
        timestamps: true,
    }
);

// Generate unique invoice number before validation
FulfillmentInvoiceSchema.pre('validate', async function (next) {
    if (this.invoiceNumber) return next();

    try {
        const date = new Date();
        const year = date.getFullYear();
        const count = await this.constructor.countDocuments({
            createdAt: {
                $gte: new Date(year, 0, 1),
                $lt: new Date(year + 1, 0, 1),
            },
        });

        this.invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(4, '0')}`;
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('FulfillmentInvoice', FulfillmentInvoiceSchema);
