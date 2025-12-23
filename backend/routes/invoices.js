const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const FulfillmentInvoice = require('../models/FulfillmentInvoice');
const StoreOrder = require('../models/StoreOrder');
const { protect, adminOnly } = require('../middleware/auth');
const walletService = require('../services/walletService');
const razorpayService = require('../services/razorpayService');

// @desc    Get all invoices for logged in merchant
// @route   GET /api/invoices
// @access  Private/Merchant
router.get('/', protect, async (req, res) => {
    try {
        const invoices = await FulfillmentInvoice.find({ merchantId: req.user.id })
            .populate('storeId', 'storeName subdomain')
            .populate('orderId', 'orderNumber status')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: invoices });
    } catch (err) {
        console.error('Fetch invoices error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc    Get all invoices for super admin
// @route   GET /api/invoices/all
// @access  Private/Admin
router.get('/all', protect, adminOnly, async (req, res) => {
    try {
        const invoices = await FulfillmentInvoice.find({})
            .populate('merchantId', 'name email')
            .populate('storeId', 'storeName subdomain')
            .populate('orderId', 'orderNumber status')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: invoices });
    } catch (err) {
        console.error('Fetch all invoices error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const invoice = await FulfillmentInvoice.findById(req.params.id)
            .populate('merchantId', 'name email phone')
            .populate('storeId', 'storeName subdomain')
            .populate('orderId');

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        // Check ownership
        if (invoice.merchantId._id.toString() !== req.user.id && req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, data: invoice });
    } catch (err) {
        console.error('Fetch invoice error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc    Pay invoice with wallet (full or partial + Razorpay)
// @route   POST /api/invoices/:id/pay-with-wallet
// @access  Private/Merchant
router.post('/:id/pay-with-wallet', protect, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { useWallet = true } = req.body;
        const invoice = await FulfillmentInvoice.findById(req.params.id).session(session);

        if (!invoice) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        if (invoice.merchantId.toString() !== req.user.id) {
            await session.abortTransaction();
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (invoice.status === 'paid') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Invoice already paid' });
        }

        // Convert invoice total to paise (assuming totalAmount is in rupees)
        const invoiceAmountPaise = Math.round(invoice.totalAmount * 100);

        // Get wallet balance
        const walletBalance = await walletService.getBalance(req.user.id);
        const availableBalancePaise = walletBalance.balancePaise;

        let walletDebitedPaise = 0;
        let remainingPaise = invoiceAmountPaise;
        let razorpayOrder = null;

        if (useWallet && availableBalancePaise > 0) {
            // Determine how much to debit from wallet
            walletDebitedPaise = Math.min(availableBalancePaise, invoiceAmountPaise);
            remainingPaise = invoiceAmountPaise - walletDebitedPaise;

            // Debit wallet
            const idempotencyKey = `invoice_wallet_${invoice._id}_${Date.now()}`;
            await walletService.debitWallet(
                req.user.id,
                walletDebitedPaise,
                {
                    type: 'DEBIT',
                    source: 'ORDER',
                    referenceType: 'INVOICE',
                    referenceId: invoice._id.toString(),
                    idempotencyKey,
                    description: `Payment for invoice ${invoice.invoiceNumber}`,
                    invoiceId: invoice._id,
                },
                session
            );

            console.log(`[Invoice] Debited ${walletDebitedPaise} paise from wallet for invoice ${invoice._id}`);
        }

        if (remainingPaise <= 0) {
            // Full wallet payment - mark invoice as paid
            invoice.status = 'paid';
            invoice.paidAt = new Date();
            invoice.paymentDetails = {
                method: 'wallet',
                walletAmountPaise: walletDebitedPaise,
                walletAmountRupees: (walletDebitedPaise / 100).toFixed(2),
            };
            await invoice.save({ session });

            // Update related order if exists
            if (invoice.orderId) {
                await StoreOrder.findByIdAndUpdate(
                    invoice.orderId,
                    {
                        'fulfillmentPayment.status': 'PAID',
                        'fulfillmentPayment.walletAppliedPaise': walletDebitedPaise,
                        'fulfillmentPayment.totalAmountPaise': invoiceAmountPaise,
                    },
                    { session }
                );
            }

            await session.commitTransaction();

            console.log(`[Invoice] Invoice ${invoice._id} fully paid with wallet`);

            return res.json({
                success: true,
                message: 'Invoice paid successfully with wallet',
                data: {
                    invoiceId: invoice._id,
                    status: 'paid',
                    walletDebitedPaise,
                    walletDebitedRupees: (walletDebitedPaise / 100).toFixed(2),
                    remainingPaise: 0,
                },
            });
        } else {
            // Partial wallet + Razorpay for remainder
            // Create Razorpay order for remaining amount
            const keyId = razorpayService.getKeyId();
            if (!keyId) {
                await session.abortTransaction();
                return res.status(500).json({
                    success: false,
                    message: 'Payment gateway not configured',
                });
            }

            const shortInvoiceId = invoice._id.toString().slice(-8);
            const receipt = `inv_${shortInvoiceId}_${Date.now().toString(36)}`;
            const notes = {
                userId: req.user.id.toString(),
                invoiceId: invoice._id.toString(),
                type: 'INVOICE_PAYMENT',
                walletDebitedPaise: walletDebitedPaise.toString(),
            };

            razorpayOrder = await razorpayService.createOrder(
                remainingPaise,
                'INR',
                receipt,
                notes
            );

            // Update invoice with pending Razorpay order
            invoice.paymentDetails = {
                method: 'wallet_and_razorpay',
                walletAmountPaise: walletDebitedPaise,
                razorpayOrderId: razorpayOrder.id,
                razorpayAmountPaise: remainingPaise,
            };
            await invoice.save({ session });

            // Update order fulfillment payment if exists
            if (invoice.orderId) {
                await StoreOrder.findByIdAndUpdate(
                    invoice.orderId,
                    {
                        'fulfillmentPayment.status': 'PAYMENT_PENDING',
                        'fulfillmentPayment.walletAppliedPaise': walletDebitedPaise,
                        'fulfillmentPayment.razorpayOrderId': razorpayOrder.id,
                        'fulfillmentPayment.totalAmountPaise': invoiceAmountPaise,
                    },
                    { session }
                );
            }

            await session.commitTransaction();

            console.log(`[Invoice] Invoice ${invoice._id} partial wallet payment, Razorpay order created for remainder: ${remainingPaise} paise`);

            return res.json({
                success: true,
                message: 'Wallet balance applied. Complete remaining payment via Razorpay.',
                data: {
                    invoiceId: invoice._id,
                    status: 'pending_razorpay',
                    walletDebitedPaise,
                    walletDebitedRupees: (walletDebitedPaise / 100).toFixed(2),
                    remainingPaise,
                    remainingRupees: (remainingPaise / 100).toFixed(2),
                    razorpayOrderId: razorpayOrder.id,
                    razorpayKeyId: keyId,
                    razorpayAmount: razorpayOrder.amount,
                    razorpayCurrency: razorpayOrder.currency,
                },
            });
        }
    } catch (err) {
        await session.abortTransaction();
        console.error('Pay invoice with wallet error:', err);
        res.status(500).json({ success: false, message: err.message || 'Server Error' });
    } finally {
        session.endSession();
    }
});

// @desc    Mark invoice as paid (legacy - simple payment)
// @route   POST /api/invoices/:id/pay
// @access  Private/Merchant
router.post('/:id/pay', protect, async (req, res) => {
    try {
        const invoice = await FulfillmentInvoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        if (invoice.merchantId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (invoice.status === 'paid') {
            return res.status(400).json({ success: false, message: 'Invoice already paid' });
        }

        // Update invoice status
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        invoice.paymentDetails = {
            transactionId: req.body.transactionId || `TRX-${Date.now()}`,
            method: req.body.method || 'wallet',
        };

        await invoice.save();

        res.json({ success: true, message: 'Invoice paid successfully', data: invoice });
    } catch (err) {
        console.error('Pay invoice error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
