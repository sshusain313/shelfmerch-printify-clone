const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const walletService = require('../services/walletService');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * Admin Wallet Management Routes
 * All routes require superadmin role
 */

// @route   GET /api/admin/wallets
// @desc    List all wallets with optional search
// @access  Private/Superadmin
router.get('/wallets', protect, authorize('superadmin'), async (req, res) => {
    try {
        const { search, limit = 50, skip = 0 } = req.query;

        const result = await walletService.getAllWallets({
            search,
            limit: Math.min(parseInt(limit) || 50, 100),
            skip: parseInt(skip) || 0,
        });

        // Transform for frontend
        const wallets = result.wallets.map((wallet) => ({
            id: wallet._id,
            userId: wallet.userId?._id || wallet.userId,
            userEmail: wallet.userId?.email,
            userName: wallet.userId?.name,
            balancePaise: wallet.balancePaise,
            balanceRupees: (wallet.balancePaise / 100).toFixed(2),
            currency: wallet.currency,
            status: wallet.status,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
        }));

        res.json({
            success: true,
            count: result.total,
            data: wallets,
            pagination: {
                total: result.total,
                limit: parseInt(limit) || 50,
                skip: parseInt(skip) || 0,
            },
        });
    } catch (error) {
        console.error('[AdminWallet] List wallets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wallets',
        });
    }
});

// @route   GET /api/admin/wallets/:userId
// @desc    Get specific user's wallet details
// @access  Private/Superadmin
router.get('/wallets/:userId', protect, authorize('superadmin'), async (req, res) => {
    try {
        const { userId } = req.params;

        const balance = await walletService.getBalance(userId);

        res.json({
            success: true,
            data: {
                userId,
                balancePaise: balance.balancePaise,
                balanceRupees: (balance.balancePaise / 100).toFixed(2),
                currency: balance.currency,
                status: balance.status,
            },
        });
    } catch (error) {
        console.error('[AdminWallet] Get wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wallet',
        });
    }
});

// @route   GET /api/admin/wallets/:userId/transactions
// @desc    Get transaction history for a specific user
// @access  Private/Superadmin
router.get('/wallets/:userId/transactions', protect, authorize('superadmin'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, cursor, status } = req.query;

        const result = await walletService.getTransactions(userId, {
            limit: Math.min(parseInt(limit) || 50, 100),
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
            adminId: txn.adminId,
            invoiceId: txn.invoiceId,
            meta: txn.meta,
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
        console.error('[AdminWallet] Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transactions',
        });
    }
});

// @route   POST /api/admin/wallets/adjust
// @desc    Adjust wallet balance (credit or debit)
// @access  Private/Superadmin
router.post('/wallets/adjust', protect, authorize('superadmin'), async (req, res) => {
    try {
        const { userId, direction, amountPaise, reason } = req.body;

        // Validate inputs
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required',
            });
        }

        if (!direction || !['CREDIT', 'DEBIT'].includes(direction)) {
            return res.status(400).json({
                success: false,
                message: 'direction must be CREDIT or DEBIT',
            });
        }

        if (!amountPaise || !Number.isInteger(amountPaise) || amountPaise <= 0) {
            return res.status(400).json({
                success: false,
                message: 'amountPaise must be a positive integer',
            });
        }

        if (!reason || reason.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'reason is required (minimum 3 characters)',
            });
        }

        // Perform adjustment
        const result = await walletService.adminAdjustBalance(
            req.user.id, // adminId
            userId,
            direction,
            amountPaise,
            reason.trim()
        );

        console.log(`[AdminWallet] Admin ${req.user.email} adjusted wallet for ${userId}: ${direction} ${amountPaise} paise. Reason: ${reason}`);

        res.json({
            success: true,
            message: `Successfully ${direction.toLowerCase()}ed ₹${(amountPaise / 100).toFixed(2)} to wallet`,
            data: {
                newBalancePaise: result.wallet.balancePaise,
                newBalanceRupees: (result.wallet.balancePaise / 100).toFixed(2),
                transactionId: result.transaction._id,
            },
        });
    } catch (error) {
        console.error('[AdminWallet] Adjust balance error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to adjust wallet balance',
        });
    }
});

// @route   GET /api/admin/wallets/stats
// @desc    Get wallet statistics
// @access  Private/Superadmin
router.get('/stats', protect, authorize('superadmin'), async (req, res) => {
    try {
        const Wallet = require('../models/Wallet');

        // Aggregate wallet stats
        const stats = await Wallet.aggregate([
            {
                $group: {
                    _id: null,
                    totalWallets: { $sum: 1 },
                    totalBalancePaise: { $sum: '$balancePaise' },
                    activeWallets: {
                        $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] },
                    },
                    lockedWallets: {
                        $sum: { $cond: [{ $eq: ['$status', 'LOCKED'] }, 1, 0] },
                    },
                },
            },
        ]);

        // Transaction stats
        const txnStats = await WalletTransaction.aggregate([
            { $match: { status: 'SUCCESS' } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalPaise: { $sum: '$amountPaise' },
                },
            },
        ]);

        const txnByType = {};
        txnStats.forEach((t) => {
            txnByType[t._id] = {
                count: t.count,
                totalPaise: t.totalPaise,
                totalRupees: (t.totalPaise / 100).toFixed(2),
            };
        });

        const walletStats = stats[0] || {
            totalWallets: 0,
            totalBalancePaise: 0,
            activeWallets: 0,
            lockedWallets: 0,
        };

        res.json({
            success: true,
            data: {
                totalWallets: walletStats.totalWallets,
                activeWallets: walletStats.activeWallets,
                lockedWallets: walletStats.lockedWallets,
                totalBalancePaise: walletStats.totalBalancePaise,
                totalBalanceRupees: (walletStats.totalBalancePaise / 100).toFixed(2),
                transactionsByType: txnByType,
            },
        });
    } catch (error) {
        console.error('[AdminWallet] Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wallet statistics',
        });
    }
});

module.exports = router;
