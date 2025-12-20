const express = require('express');
const router = express.Router();
const FulfillmentInvoice = require('../models/FulfillmentInvoice');
const { protect, adminOnly } = require('../middleware/auth'); // Assuming standard auth middleware exists

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

// @desc    Mark invoice as paid (Simulated for now, would integrate with a payment gateway)
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
