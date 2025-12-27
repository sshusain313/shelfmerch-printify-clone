const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const withdrawalService = require('../services/withdrawalService');
const WithdrawalRequest = require('../models/WithdrawalRequest');

/**
 * Admin Withdrawal Management Routes
 * All routes require superadmin role
 */

// @route   GET /api/admin/withdrawals/stats
// @desc    Get withdrawal statistics for dashboard
// @access  Private/Superadmin
router.get('/stats', protect, authorize('superadmin'), async (req, res) => {
    try {
        const stats = await withdrawalService.getStats();

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('[AdminWithdrawals] Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawal statistics',
        });
    }
});

// @route   GET /api/admin/withdrawals
// @desc    List all withdrawal requests with filters
// @access  Private/Superadmin
router.get('/', protect, authorize('superadmin'), async (req, res) => {
    try {
        const { status, merchantId, limit = 50, skip = 0 } = req.query;

        const result = await withdrawalService.getAllForAdmin({
            status,
            merchantId,
            limit: Math.min(parseInt(limit) || 50, 100),
            skip: parseInt(skip) || 0,
        });

        // Transform for frontend
        const requests = result.requests.map((r) => ({
            id: r._id,
            merchantId: r.merchantId?._id || r.merchantId,
            merchantEmail: r.merchantId?.email,
            merchantName: r.merchantId?.name,
            amountPaise: r.amountPaise,
            amountRupees: (r.amountPaise / 100).toFixed(2),
            currency: r.currency,
            upiId: r.upiId,
            status: r.status,
            requestedAt: r.requestedAt,
            reviewedAt: r.reviewedAt,
            reviewedBy: r.reviewedBy?.email,
            paidAt: r.paidAt,
            rejectionReason: r.rejectionReason,
            payoutMethod: r.payoutMethod,
            payoutReference: r.payoutReference,
            payoutNotes: r.payoutNotes,
        }));

        res.json({
            success: true,
            data: requests,
            pagination: {
                total: result.total,
                limit: parseInt(limit) || 50,
                skip: parseInt(skip) || 0,
            },
        });
    } catch (error) {
        console.error('[AdminWithdrawals] List error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawal requests',
        });
    }
});

// @route   GET /api/admin/withdrawals/:id
// @desc    Get single withdrawal request details
// @access  Private/Superadmin
router.get('/:id', protect, authorize('superadmin'), async (req, res) => {
    try {
        const request = await WithdrawalRequest.findById(req.params.id)
            .populate('merchantId', 'name email')
            .populate('reviewedBy', 'name email')
            .populate('transactionId');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal request not found',
            });
        }

        res.json({
            success: true,
            data: {
                id: request._id,
                merchantId: request.merchantId?._id,
                merchantEmail: request.merchantId?.email,
                merchantName: request.merchantId?.name,
                amountPaise: request.amountPaise,
                amountRupees: (request.amountPaise / 100).toFixed(2),
                currency: request.currency,
                upiId: request.upiId,
                status: request.status,
                requestedAt: request.requestedAt,
                reviewedAt: request.reviewedAt,
                reviewedBy: request.reviewedBy?.email,
                paidAt: request.paidAt,
                rejectionReason: request.rejectionReason,
                payoutMethod: request.payoutMethod,
                payoutReference: request.payoutReference,
                payoutNotes: request.payoutNotes,
                balanceBeforeRequestPaise: request.balanceBeforeRequestPaise,
                transactionId: request.transactionId?._id,
            },
        });
    } catch (error) {
        console.error('[AdminWithdrawals] Get details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawal request',
        });
    }
});

// @route   POST /api/admin/withdrawals/:id/approve
// @desc    Approve a withdrawal request (deducts wallet balance)
// @access  Private/Superadmin
router.post('/:id/approve', protect, authorize('superadmin'), async (req, res) => {
    try {
        const result = await withdrawalService.approveRequest(
            req.params.id,
            req.user.id
        );

        console.log(
            `[AdminWithdrawals] Admin ${req.user.email} approved withdrawal ${req.params.id}`
        );

        res.json({
            success: true,
            message: 'Withdrawal request approved successfully',
            data: {
                id: result.request._id,
                status: result.request.status,
                amountPaise: result.request.amountPaise,
                amountRupees: (result.request.amountPaise / 100).toFixed(2),
                transactionId: result.transaction._id,
            },
        });
    } catch (error) {
        console.error('[AdminWithdrawals] Approve error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to approve withdrawal request',
        });
    }
});

// @route   POST /api/admin/withdrawals/:id/reject
// @desc    Reject a withdrawal request
// @access  Private/Superadmin
router.post('/:id/reject', protect, authorize('superadmin'), async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason || reason.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required (minimum 3 characters)',
            });
        }

        const request = await withdrawalService.rejectRequest(
            req.params.id,
            req.user.id,
            reason
        );

        console.log(
            `[AdminWithdrawals] Admin ${req.user.email} rejected withdrawal ${req.params.id}`
        );

        res.json({
            success: true,
            message: 'Withdrawal request rejected',
            data: {
                id: request._id,
                status: request.status,
                rejectionReason: request.rejectionReason,
            },
        });
    } catch (error) {
        console.error('[AdminWithdrawals] Reject error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to reject withdrawal request',
        });
    }
});

// @route   POST /api/admin/withdrawals/:id/mark-paid
// @desc    Mark a withdrawal request as paid (after manual payout)
// @access  Private/Superadmin
router.post('/:id/mark-paid', protect, authorize('superadmin'), async (req, res) => {
    try {
        const { payoutReference, notes } = req.body;

        if (!payoutReference || payoutReference.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Payout reference (UTR) is required',
            });
        }

        const request = await withdrawalService.markAsPaid(
            req.params.id,
            req.user.id,
            payoutReference,
            notes || ''
        );

        console.log(
            `[AdminWithdrawals] Admin ${req.user.email} marked withdrawal ${req.params.id} as PAID`
        );

        res.json({
            success: true,
            message: 'Withdrawal marked as paid',
            data: {
                id: request._id,
                status: request.status,
                payoutReference: request.payoutReference,
                paidAt: request.paidAt,
            },
        });
    } catch (error) {
        console.error('[AdminWithdrawals] Mark paid error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to mark withdrawal as paid',
        });
    }
});

module.exports = router;
