const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { protect } = require('../middleware/auth');
const walletService = require('../services/walletService');
const razorpayService = require('../services/razorpayService');

/**
 * User Wallet Routes
 * All routes require authentication
 */

// @route   GET /api/wallet
// @desc    Get current user's wallet balance
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const balance = await walletService.getBalance(req.user.id);

        res.json({
            success: true,
            data: {
                balancePaise: balance.balancePaise,
                balanceRupees: (balance.balancePaise / 100).toFixed(2),
                currency: balance.currency,
                status: balance.status,
            },
        });
    } catch (error) {
        console.error('[Wallet] Get balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wallet balance',
        });
    }
});

// @route   GET /api/wallet/transactions
// @desc    Get paginated transaction history for current user
// @access  Private
router.get('/transactions', protect, async (req, res) => {
    try {
        const { limit = 20, cursor, status } = req.query;

        const result = await walletService.getTransactions(req.user.id, {
            limit: Math.min(parseInt(limit) || 20, 100),
            cursor,
            status,
        });

        // Transform for frontend
        const transactions = result.transactions.map((txn) => ({
            id: txn._id,
            type: txn.type,
            direction: txn.direction,
            amountPaise: txn.amountPaise,
            amountRupees: (txn.amountPaise / 100).toFixed(2),
            status: txn.status,
            source: txn.source,
            referenceType: txn.referenceType,
            referenceId: txn.referenceId,
            description: txn.description,
            balanceBeforePaise: txn.balanceBeforePaise,
            balanceAfterPaise: txn.balanceAfterPaise,
            createdAt: txn.createdAt,
            completedAt: txn.completedAt,
        }));

        res.json({
            success: true,
            count: result.total,
            data: transactions,
            pagination: {
                total: result.total,
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
            },
        });
    } catch (error) {
        console.error('[Wallet] Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions',
        });
    }
});

// @route   POST /api/wallet/topup/create-order
// @desc    Create Razorpay order for wallet top-up
// @access  Private
router.post('/topup/create-order', protect, async (req, res) => {
    try {
        const { amountPaise } = req.body;

        // Validate amount
        if (!amountPaise || !Number.isInteger(amountPaise)) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be an integer (in paise)',
            });
        }

        // Minimum ₹1 (100 paise)
        if (amountPaise < 100) {
            return res.status(400).json({
                success: false,
                message: 'Minimum top-up amount is ₹1',
            });
        }

        // Maximum ₹1,00,000 (10,000,000 paise)
        if (amountPaise > 10000000) {
            return res.status(400).json({
                success: false,
                message: 'Maximum top-up amount is ₹1,00,000',
            });
        }

        // Check if Razorpay is configured
        const keyId = razorpayService.getKeyId();
        if (!keyId) {
            return res.status(500).json({
                success: false,
                message: 'Payment gateway not configured',
            });
        }

        // Create Razorpay order
        // Receipt max 40 chars - use shortened format
        const shortUserId = req.user.id.toString().slice(-8);
        const receipt = `tu_${shortUserId}_${Date.now().toString(36)}`;
        const notes = {
            userId: req.user.id.toString(),
            userEmail: req.user.email,
            type: 'WALLET_TOPUP',
        };

        const razorpayOrder = await razorpayService.createOrder(
            amountPaise,
            'INR',
            receipt,
            notes
        );

        // Create pending transaction (will be marked SUCCESS by webhook)
        await walletService.createPendingTransaction(req.user.id, amountPaise, {
            razorpayOrderId: razorpayOrder.id,
            idempotencyKey: `topup_${razorpayOrder.id}`,
            meta: {
                receipt,
                userEmail: req.user.email,
            },
        });

        console.log(`[Wallet] Created topup order ${razorpayOrder.id} for user ${req.user.id}, amount: ${amountPaise} paise`);

        res.json({
            success: true,
            data: {
                razorpayOrderId: razorpayOrder.id,
                amountPaise: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                razorpayKeyId: keyId,
                receipt: razorpayOrder.receipt,
            },
        });
    } catch (error) {
        console.error('[Wallet] Create topup order error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create payment order',
        });
    }
});

// @route   POST /api/wallet/topup/verify
// @desc    Verify Razorpay payment and credit wallet (called from frontend after success)
// @access  Private
router.post('/topup/verify', protect, async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({
                success: false,
                message: 'Missing razorpayOrderId, razorpayPaymentId, or razorpaySignature',
            });
        }

        if (!razorpayService.verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature',
            });
        }

        const payment = await razorpayService.fetchPayment(razorpayPaymentId);
        if (!payment || payment.status !== 'captured') {
            return res.status(400).json({
                success: false,
                message: 'Payment not captured yet',
            });
        }

        const amountPaise = payment.amount;
        const orderId = payment.order_id;

        if (orderId !== razorpayOrderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID mismatch',
            });
        }

        const pendingTxn = await walletService.findTransactionByIdempotencyKey(`topup_${razorpayOrderId}`);
        if (!pendingTxn) {
            return res.status(404).json({
                success: false,
                message: 'Top-up order not found',
            });
        }

        if (pendingTxn.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'This payment does not belong to you',
            });
        }

        const mongoose = require('mongoose');
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const txnData = {
                type: 'TOPUP',
                source: 'RAZORPAY',
                referenceType: 'RAZORPAY_PAYMENT',
                referenceId: razorpayPaymentId,
                idempotencyKey: `topup_${razorpayOrderId}`,
                description: 'Wallet top-up via Razorpay',
                meta: {
                    razorpayOrderId,
                    razorpayPaymentId,
                    verifiedVia: 'frontend_callback',
                },
            };

            const result = await walletService.creditWallet(req.user.id, amountPaise, txnData, session);
            await session.commitTransaction();

            const balance = await walletService.getBalance(req.user.id);

            console.log(`[Wallet] Top-up verified and credited: ${amountPaise} paise for user ${req.user.id}`);

            res.json({
                success: true,
                data: {
                    credited: true,
                    amountPaise,
                    balancePaise: balance.balancePaise,
                    balanceRupees: (balance.balancePaise / 100).toFixed(2),
                },
            });
        } catch (err) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error('[Wallet] Verify topup error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to verify and credit payment',
        });
    }
});

module.exports = router;
