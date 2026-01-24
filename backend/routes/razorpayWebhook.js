const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const razorpayService = require('../services/razorpayService');
const walletService = require('../services/walletService');
const WalletTransaction = require('../models/WalletTransaction');
const FulfillmentInvoice = require('../models/FulfillmentInvoice');
const StoreOrder = require('../models/StoreOrder');

/**
 * Razorpay Webhook Handler
 * 
 * CRITICAL: This route uses raw body parsing for signature verification.
 * It must be registered BEFORE express.json() middleware OR configured
 * to bypass JSON parsing for this specific route.
 * 
 * Webhook events handled:
 * - payment.captured: For wallet top-ups and order payments
 * - order.paid: Alternative event for order completion
 */

// @route   POST /api/razorpay/webhook
// @desc    Handle Razorpay webhook events
// @access  Public (signature verified)
router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
        const signature = req.headers['x-razorpay-signature'];
        const rawBody = req.body;

        // Verify signature FIRST
        if (!razorpayService.verifyWebhookSignature(rawBody, signature)) {
            console.error('[Webhook] Invalid signature');
            return res.status(401).json({ success: false, message: 'Invalid signature' });
        }

        let event;
        try {
            // Parse the raw body after verification
            event = JSON.parse(rawBody.toString());
        } catch (error) {
            console.error('[Webhook] Failed to parse webhook body:', error);
            return res.status(400).json({ success: false, message: 'Invalid JSON' });
        }

        const eventType = event.event;
        const payload = event.payload;

        console.log(`[Webhook] Received event: ${eventType}`);

        try {
            switch (eventType) {
                case 'payment.captured':
                    await handlePaymentCaptured(payload);
                    break;
                case 'order.paid':
                    await handleOrderPaid(payload);
                    break;
                default:
                    console.log(`[Webhook] Unhandled event type: ${eventType}`);
            }

            // Always return 200 to acknowledge receipt
            // (Razorpay will retry if not 2xx)
            res.json({ success: true, message: 'Webhook processed' });
        } catch (error) {
            console.error(`[Webhook] Error processing ${eventType}:`, error);
            // Still return 200 to prevent infinite retries for non-retryable errors
            // Log the error for investigation
            res.json({ success: true, message: 'Webhook received with errors' });
        }
    }
);

/**
 * Handle payment.captured event
 * Credits wallet for top-ups or marks orders as paid
 */
async function handlePaymentCaptured(payload) {
    const payment = payload.payment?.entity;
    if (!payment) {
        console.error('[Webhook] No payment entity in payload');
        return;
    }

    const { order_id: orderId, id: paymentId, amount, notes } = payment;

    console.log(`[Webhook] Processing payment.captured: orderId=${orderId}, paymentId=${paymentId}, amount=${amount}`);

    // Check if this is a wallet top-up (notes may be on order, not payment - resolve userId from our DB)
    if (notes?.type === 'WALLET_TOPUP' && notes?.userId) {
        await processWalletTopup(orderId, paymentId, amount, notes);
        return;
    }
    if (notes?.type === 'INVOICE_PAYMENT') {
        await processInvoicePayment(orderId, paymentId, amount, notes);
        return;
    }

    // Fallback: look up our pending top-up transaction by orderId (Razorpay often omits order notes on payment entity)
    const pendingTxn = await WalletTransaction.findOne({
        referenceId: orderId,
        type: 'TOPUP',
        status: 'PENDING',
    });
    if (pendingTxn) {
        const notesFromDb = { userId: pendingTxn.userId.toString(), type: 'WALLET_TOPUP' };
        await processWalletTopup(orderId, paymentId, amount, notesFromDb);
        return;
    }

    console.log(`[Webhook] Unknown payment type, skipping. orderId=${orderId} notes=`, notes);
}

/**
 * Handle order.paid event (alternative to payment.captured)
 */
async function handleOrderPaid(payload) {
    const order = payload.order?.entity;
    if (!order) {
        console.error('[Webhook] No order entity in payload');
        return;
    }

    const { id: orderId, amount, notes } = order;

    console.log(`[Webhook] Processing order.paid: orderId=${orderId}, amount=${amount}`);

    if (notes?.type === 'WALLET_TOPUP' && notes?.userId) {
        await processWalletTopup(orderId, null, amount, notes);
        return;
    }
    if (notes?.type === 'INVOICE_PAYMENT') {
        await processInvoicePayment(orderId, null, amount, notes);
        return;
    }

    const pendingTxn = await WalletTransaction.findOne({
        referenceId: orderId,
        type: 'TOPUP',
        status: 'PENDING',
    });
    if (pendingTxn) {
        const notesFromDb = { userId: pendingTxn.userId.toString(), type: 'WALLET_TOPUP' };
        await processWalletTopup(orderId, null, amount, notesFromDb);
    }
}

/**
 * Process wallet top-up credit
 * IDEMPOTENT: Will not double-credit if already processed
 */
async function processWalletTopup(razorpayOrderId, paymentId, amountPaise, notes) {
    const userId = notes?.userId;
    if (!userId) {
        console.error('[Webhook] No userId in wallet topup notes');
        return;
    }

    const idempotencyKey = `topup_${razorpayOrderId}`;

    // Check if already processed
    const existingTxn = await WalletTransaction.findOne({ idempotencyKey });
    if (existingTxn && existingTxn.status === 'SUCCESS') {
        console.log(`[Webhook] Wallet topup already processed: ${idempotencyKey}`);
        return;
    }

    // Start session for atomic operation
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const txnData = {
            type: 'TOPUP',
            source: 'RAZORPAY',
            referenceType: 'RAZORPAY_PAYMENT',
            referenceId: paymentId || razorpayOrderId,
            idempotencyKey,
            description: 'Wallet top-up via Razorpay',
            meta: {
                razorpayOrderId,
                razorpayPaymentId: paymentId,
                originalNotes: notes,
            },
        };

        const result = await walletService.creditWallet(userId, amountPaise, txnData, session);

        await session.commitTransaction();

        if (result.alreadyProcessed) {
            console.log(`[Webhook] Wallet topup was already processed (concurrent): ${idempotencyKey}`);
        } else {
            console.log(`[Webhook] ✓ Wallet topup processed: ${amountPaise} paise credited to user ${userId}`);
        }
    } catch (error) {
        await session.abortTransaction();
        console.error('[Webhook] Failed to process wallet topup:', error);
        throw error;
    } finally {
        session.endSession();
    }
}

/**
 * Process invoice payment (for partial wallet + Razorpay)
 */
async function processInvoicePayment(razorpayOrderId, paymentId, amountPaise, notes) {
    const invoiceId = notes?.invoiceId;
    const userId = notes?.userId;

    if (!invoiceId) {
        console.error('[Webhook] No invoiceId in invoice payment notes');
        return;
    }

    const idempotencyKey = `invoice_remainder_${razorpayOrderId}`;

    // Check if already processed (use a different mechanism for invoices)
    const invoice = await FulfillmentInvoice.findById(invoiceId);
    if (!invoice) {
        console.error(`[Webhook] Invoice not found: ${invoiceId}`);
        return;
    }

    if (invoice.status === 'paid') {
        console.log(`[Webhook] Invoice already paid: ${invoiceId}`);
        return;
    }

    // Mark invoice as paid
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    invoice.paymentDetails = {
        ...invoice.paymentDetails,
        razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpayAmountPaise: amountPaise,
        paidVia: 'RAZORPAY_REMAINDER',
    };
    await invoice.save();

    console.log(`[Webhook] ✓ Invoice marked as paid: ${invoiceId}`);

    // Also update related order's fulfillmentPayment status if exists
    if (invoice.orderId) {
        await StoreOrder.findByIdAndUpdate(invoice.orderId, {
            'fulfillmentPayment.status': 'PAID',
            'fulfillmentPayment.razorpayOrderId': razorpayOrderId,
            'fulfillmentPayment.razorpayPaymentId': paymentId,
        });
        console.log(`[Webhook] ✓ Order fulfillment payment updated: ${invoice.orderId}`);
    }
}

module.exports = router;
