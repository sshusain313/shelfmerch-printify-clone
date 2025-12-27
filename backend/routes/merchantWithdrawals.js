const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const withdrawalService = require('../services/withdrawalService');

/**
 * Merchant Withdrawal Routes
 * All routes require merchant authentication
 */

// @route   GET /api/merchant/wallet/summary
// @desc    Get wallet summary including pending withdrawals
// @access  Private/Merchant
router.get('/wallet/summary', protect, async (req, res) => {
    try {
        const summary = await withdrawalService.getWalletSummary(req.user.id);

        res.json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error('[MerchantWithdrawals] Get summary error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch wallet summary',
        });
    }
});

// @route   GET /api/merchant/withdrawals
// @desc    Get merchant's withdrawal requests with pagination
// @access  Private/Merchant
router.get('/withdrawals', protect, async (req, res) => {
    try {
        const { status, limit = 20, skip = 0 } = req.query;

        const result = await withdrawalService.getForMerchant(req.user.id, {
            status,
            limit: Math.min(parseInt(limit) || 20, 50),
            skip: parseInt(skip) || 0,
        });

        // Transform for frontend
        const requests = result.requests.map((r) => ({
            id: r._id,
            amountPaise: r.amountPaise,
            amountRupees: (r.amountPaise / 100).toFixed(2),
            currency: r.currency,
            upiId: r.upiId,
            status: r.status,
            requestedAt: r.requestedAt,
            reviewedAt: r.reviewedAt,
            paidAt: r.paidAt,
            rejectionReason: r.rejectionReason,
            payoutMethod: r.payoutMethod,
            payoutReference: r.payoutReference,
        }));

        res.json({
            success: true,
            data: requests,
            pagination: {
                total: result.total,
                limit: parseInt(limit) || 20,
                skip: parseInt(skip) || 0,
            },
        });
    } catch (error) {
        console.error('[MerchantWithdrawals] List error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawal requests',
        });
    }
});

// @route   POST /api/merchant/withdrawals
// @desc    Create a new withdrawal request
// @access  Private/Merchant
router.post('/withdrawals', protect, async (req, res) => {
    try {
        const { amountPaise, upiId } = req.body;

        // Validate inputs
        if (!amountPaise || !Number.isInteger(amountPaise)) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be an integer (in paise)',
            });
        }

        if (amountPaise < 10000) {
            return res.status(400).json({
                success: false,
                message: 'Minimum withdrawal amount is ₹100',
            });
        }

        if (!upiId || typeof upiId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'UPI ID is required',
            });
        }

        // Validate UPI format
        if (!withdrawalService.validateUpiId(upiId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid UPI ID format. Expected format: user@provider',
            });
        }

        const request = await withdrawalService.createRequest(
            req.user.id,
            amountPaise,
            upiId
        );

        console.log(
            `[MerchantWithdrawals] Created withdrawal request ${request._id} for user ${req.user.id}`
        );

        res.status(201).json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            data: {
                id: request._id,
                amountPaise: request.amountPaise,
                amountRupees: (request.amountPaise / 100).toFixed(2),
                upiId: request.upiId,
                status: request.status,
                requestedAt: request.requestedAt,
            },
        });
    } catch (error) {
        console.error('[MerchantWithdrawals] Create error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create withdrawal request',
        });
    }
});

module.exports = router;
