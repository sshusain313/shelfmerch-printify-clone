const mongoose = require('mongoose');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const walletService = require('./walletService');
const WalletTransaction = require('../models/WalletTransaction');
const Wallet = require('../models/Wallet');

/**
 * Withdrawal Service
 * Handles all withdrawal request business logic.
 * Uses MongoDB transactions for atomic operations.
 */

/**
 * Validate UPI ID format
 * @param {string} upiId - UPI ID to validate
 * @returns {boolean}
 */
const validateUpiId = (upiId) => {
    if (!upiId || typeof upiId !== 'string') return false;
    // Format: alphanumeric/dots/dashes @ alphanumeric
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    return upiRegex.test(upiId.trim());
};

/**
 * Create a new withdrawal request
 * @param {string} merchantId - Merchant's user ID
 * @param {number} amountPaise - Amount in paise
 * @param {string} upiId - UPI ID for payout
 * @returns {Promise<WithdrawalRequest>}
 */
const createRequest = async (merchantId, amountPaise, upiId) => {
    // Validate inputs
    if (!merchantId) {
        throw new Error('Merchant ID is required');
    }

    if (!amountPaise || !Number.isInteger(amountPaise) || amountPaise < 10000) {
        throw new Error('Minimum withdrawal amount is ₹100');
    }

    if (!validateUpiId(upiId)) {
        throw new Error('Invalid UPI ID format. Expected format: user@provider');
    }

    // Get wallet balance
    const wallet = await Wallet.findOne({ userId: merchantId });
    if (!wallet) {
        throw new Error('Wallet not found');
    }

    if (wallet.status !== 'ACTIVE') {
        throw new Error('Wallet is not active');
    }

    // Calculate available balance (total - pending withdrawals)
    const pendingAmountPaise = await WithdrawalRequest.getPendingAmountPaise(merchantId);
    const availableBalancePaise = wallet.balancePaise - pendingAmountPaise;

    if (amountPaise > availableBalancePaise) {
        throw new Error(
            `Insufficient balance. Available: ₹${(availableBalancePaise / 100).toFixed(2)}, Requested: ₹${(amountPaise / 100).toFixed(2)}`
        );
    }

    // Create the withdrawal request
    const withdrawalRequest = await WithdrawalRequest.create({
        merchantId,
        amountPaise,
        upiId: upiId.trim().toLowerCase(),
        status: 'PENDING',
        requestedAt: new Date(),
        balanceBeforeRequestPaise: wallet.balancePaise,
    });

    console.log(
        `[WithdrawalService] Created withdrawal request ${withdrawalRequest._id} for merchant ${merchantId}, amount: ₹${(amountPaise / 100).toFixed(2)}`
    );

    return withdrawalRequest;
};

/**
 * Approve a withdrawal request (deducts wallet balance)
 * @param {string} requestId - Withdrawal request ID
 * @param {string} adminId - Admin user ID approving the request
 * @returns {Promise<{request: WithdrawalRequest, transaction: WalletTransaction}>}
 */
const approveRequest = async (requestId, adminId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find the request with lock
        const request = await WithdrawalRequest.findById(requestId).session(session);

        if (!request) {
            throw new Error('Withdrawal request not found');
        }

        if (request.status !== 'PENDING') {
            throw new Error(`Cannot approve request with status: ${request.status}`);
        }

        // Get wallet
        const wallet = await Wallet.findOne({ userId: request.merchantId }).session(session);

        if (!wallet) {
            throw new Error('Merchant wallet not found');
        }

        if (wallet.status !== 'ACTIVE') {
            throw new Error('Merchant wallet is not active');
        }

        // Check if balance is sufficient
        if (wallet.balancePaise < request.amountPaise) {
            throw new Error('Insufficient wallet balance for this withdrawal');
        }

        // Create idempotency key for the withdrawal transaction
        const idempotencyKey = `withdrawal_${request._id}_${Date.now()}`;

        // Debit the wallet
        const balanceBefore = wallet.balancePaise;
        const balanceAfter = balanceBefore - request.amountPaise;

        // Update wallet balance atomically
        const updatedWallet = await Wallet.findOneAndUpdate(
            { _id: wallet._id, balancePaise: { $gte: request.amountPaise } },
            { $inc: { balancePaise: -request.amountPaise } },
            { new: true, session }
        );

        if (!updatedWallet) {
            throw new Error('Failed to debit wallet - concurrent modification or insufficient balance');
        }

        // Create the wallet transaction
        const [transaction] = await WalletTransaction.create(
            [
                {
                    walletId: wallet._id,
                    userId: request.merchantId,
                    type: 'WITHDRAWAL',
                    direction: 'DEBIT',
                    amountPaise: request.amountPaise,
                    balanceBeforePaise: balanceBefore,
                    balanceAfterPaise: balanceAfter,
                    status: 'SUCCESS',
                    source: 'SYSTEM',
                    referenceType: 'WITHDRAWAL_REQUEST',
                    referenceId: request._id.toString(),
                    idempotencyKey,
                    description: `Withdrawal request approved - UPI: ${request.upiId}`,
                    adminId,
                    completedAt: new Date(),
                },
            ],
            { session }
        );

        // Update the withdrawal request
        request.status = 'APPROVED';
        request.reviewedAt = new Date();
        request.reviewedBy = adminId;
        request.transactionId = transaction._id;
        await request.save({ session });

        await session.commitTransaction();

        console.log(
            `[WithdrawalService] Admin ${adminId} approved withdrawal ${requestId}, ₹${(request.amountPaise / 100).toFixed(2)}`
        );

        return { request, transaction };
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Reject a withdrawal request
 * @param {string} requestId - Withdrawal request ID
 * @param {string} adminId - Admin user ID rejecting the request
 * @param {string} reason - Reason for rejection
 * @returns {Promise<WithdrawalRequest>}
 */
const rejectRequest = async (requestId, adminId, reason) => {
    if (!reason || reason.trim().length < 3) {
        throw new Error('Rejection reason is required (minimum 3 characters)');
    }

    const request = await WithdrawalRequest.findById(requestId);

    if (!request) {
        throw new Error('Withdrawal request not found');
    }

    if (request.status !== 'PENDING') {
        throw new Error(`Cannot reject request with status: ${request.status}`);
    }

    request.status = 'REJECTED';
    request.reviewedAt = new Date();
    request.reviewedBy = adminId;
    request.rejectionReason = reason.trim();
    await request.save();

    console.log(
        `[WithdrawalService] Admin ${adminId} rejected withdrawal ${requestId}, reason: ${reason}`
    );

    return request;
};

/**
 * Mark a withdrawal request as paid
 * @param {string} requestId - Withdrawal request ID
 * @param {string} adminId - Admin user ID marking as paid
 * @param {string} payoutReference - UTR or transaction reference
 * @param {string} notes - Optional notes
 * @returns {Promise<WithdrawalRequest>}
 */
const markAsPaid = async (requestId, adminId, payoutReference, notes = '') => {
    if (!payoutReference || payoutReference.trim().length < 3) {
        throw new Error('Payout reference (UTR) is required');
    }

    const request = await WithdrawalRequest.findById(requestId);

    if (!request) {
        throw new Error('Withdrawal request not found');
    }

    if (request.status !== 'APPROVED') {
        throw new Error(`Cannot mark as paid - request status is: ${request.status}`);
    }

    request.status = 'PAID';
    request.paidAt = new Date();
    request.payoutReference = payoutReference.trim();
    request.payoutNotes = notes ? notes.trim() : '';
    await request.save();

    console.log(
        `[WithdrawalService] Admin ${adminId} marked withdrawal ${requestId} as PAID, UTR: ${payoutReference}`
    );

    return request;
};

/**
 * Get withdrawal requests for a merchant
 * @param {string} merchantId - Merchant's user ID
 * @param {object} options - Query options
 * @returns {Promise<{requests: WithdrawalRequest[], total: number}>}
 */
const getForMerchant = async (merchantId, options = {}) => {
    const { status, limit = 20, skip = 0 } = options;

    const query = { merchantId };
    if (status) {
        query.status = status;
    }

    const [requests, total] = await Promise.all([
        WithdrawalRequest.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        WithdrawalRequest.countDocuments(query),
    ]);

    return { requests, total };
};

/**
 * Get all withdrawal requests for admin
 * @param {object} options - Query options
 * @returns {Promise<{requests: WithdrawalRequest[], total: number}>}
 */
const getAllForAdmin = async (options = {}) => {
    const { status, merchantId, limit = 50, skip = 0 } = options;

    const query = {};
    if (status) {
        query.status = status;
    }
    if (merchantId) {
        query.merchantId = merchantId;
    }

    const [requests, total] = await Promise.all([
        WithdrawalRequest.find(query)
            .populate('merchantId', 'name email')
            .populate('reviewedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        WithdrawalRequest.countDocuments(query),
    ]);

    return { requests, total };
};

/**
 * Get withdrawal statistics for admin dashboard
 * @returns {Promise<object>}
 */
const getStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [statusCounts, todayApproved, todayPaid] = await Promise.all([
        WithdrawalRequest.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalPaise: { $sum: '$amountPaise' },
                },
            },
        ]),
        WithdrawalRequest.aggregate([
            {
                $match: {
                    status: 'APPROVED',
                    reviewedAt: { $gte: today },
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalPaise: { $sum: '$amountPaise' },
                },
            },
        ]),
        WithdrawalRequest.aggregate([
            {
                $match: {
                    status: 'PAID',
                    paidAt: { $gte: today },
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalPaise: { $sum: '$amountPaise' },
                },
            },
        ]),
    ]);

    const byStatus = {};
    statusCounts.forEach((s) => {
        byStatus[s._id] = {
            count: s.count,
            totalPaise: s.totalPaise,
            totalRupees: (s.totalPaise / 100).toFixed(2),
        };
    });

    return {
        byStatus,
        todayApproved: {
            count: todayApproved[0]?.count || 0,
            totalPaise: todayApproved[0]?.totalPaise || 0,
            totalRupees: ((todayApproved[0]?.totalPaise || 0) / 100).toFixed(2),
        },
        todayPaid: {
            count: todayPaid[0]?.count || 0,
            totalPaise: todayPaid[0]?.totalPaise || 0,
            totalRupees: ((todayPaid[0]?.totalPaise || 0) / 100).toFixed(2),
        },
    };
};

/**
 * Get wallet summary including pending withdrawals
 * @param {string} merchantId - Merchant's user ID
 * @returns {Promise<object>}
 */
const getWalletSummary = async (merchantId) => {
    const balance = await walletService.getBalance(merchantId);
    const pendingAmountPaise = await WithdrawalRequest.getPendingAmountPaise(merchantId);

    return {
        balancePaise: balance.balancePaise,
        balanceRupees: (balance.balancePaise / 100).toFixed(2),
        currency: balance.currency,
        status: balance.status,
        pendingWithdrawalsPaise: pendingAmountPaise,
        pendingWithdrawalsRupees: (pendingAmountPaise / 100).toFixed(2),
        availableForWithdrawalPaise: balance.balancePaise - pendingAmountPaise,
        availableForWithdrawalRupees: ((balance.balancePaise - pendingAmountPaise) / 100).toFixed(2),
    };
};

module.exports = {
    validateUpiId,
    createRequest,
    approveRequest,
    rejectRequest,
    markAsPaid,
    getForMerchant,
    getAllForAdmin,
    getStats,
    getWalletSummary,
};
