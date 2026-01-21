const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * Wallet Service
 * Core service for all wallet operations.
 * All balance changes must go through this service to ensure:
 * 1. Atomic operations with MongoDB sessions
 * 2. Transaction logging for audit trail
 * 3. Proper balance validation
 */

/**
 * Get or create a wallet for a user
 * @param {string} userId - User's MongoDB ObjectId
 * @param {mongoose.ClientSession} session - Optional MongoDB session
 * @returns {Promise<Wallet>} User's wallet
 */
const getOrCreateWallet = async (userId, session = null) => {
    const options = session ? { session } : {};

    let wallet = await Wallet.findOne({ userId }).session(session);

    if (!wallet) {
        // Create new wallet
        const [newWallet] = await Wallet.create(
            [
                {
                    userId,
                    currency: 'INR',
                    balancePaise: 0,
                    status: 'ACTIVE',
                },
            ],
            options
        );
        wallet = newWallet;
        console.log(`[WalletService] Created new wallet for user ${userId}`);
    }

    return wallet;
};

/**
 * Get wallet balance for a user
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {Promise<{balancePaise: number, currency: string, status: string}>}
 */
const getBalance = async (userId) => {
    const wallet = await getOrCreateWallet(userId);
    return {
        balancePaise: wallet.balancePaise,
        currency: wallet.currency,
        status: wallet.status,
    };
};

/**
 * Check if a transaction with the given idempotency key exists
 * @param {string} idempotencyKey - Unique idempotency key
 * @returns {Promise<WalletTransaction|null>}
 */
const findTransactionByIdempotencyKey = async (idempotencyKey) => {
    return WalletTransaction.findOne({ idempotencyKey });
};

/**
 * Credit wallet (add funds)
 * @param {string} userId - User's MongoDB ObjectId
 * @param {number} amountPaise - Amount to credit in paise
 * @param {object} txnData - Transaction data
 * @param {mongoose.ClientSession} session - MongoDB session for atomicity
 * @returns {Promise<{wallet: Wallet, transaction: WalletTransaction}>}
 */
const creditWallet = async (userId, amountPaise, txnData, session = null) => {
    // Session is optional for standalone MongoDB (local dev)
    // if (!session) {
    //     throw new Error('Session required for atomic wallet operations');
    // }

    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
        throw new Error('Amount must be a positive integer');
    }

    // Check idempotency
    const existingTxn = await WalletTransaction.findOne({
        idempotencyKey: txnData.idempotencyKey,
    }).session(session);

    if (existingTxn) {
        if (existingTxn.status === 'SUCCESS') {
            console.log(`[WalletService] Idempotent return - transaction already successful: ${txnData.idempotencyKey}`);
            const wallet = await Wallet.findOne({ userId }).session(session);
            return { wallet, transaction: existingTxn, alreadyProcessed: true };
        }
        // If pending/failed, we can retry
    }

    // Get or create wallet
    const wallet = await getOrCreateWallet(userId, session);

    if (wallet.status !== 'ACTIVE') {
        throw new Error('Wallet is not active');
    }

    const balanceBefore = wallet.balancePaise;
    const balanceAfter = balanceBefore + amountPaise;

    // Update wallet balance atomically
    const updatedWallet = await Wallet.findOneAndUpdate(
        { _id: wallet._id },
        { $inc: { balancePaise: amountPaise } },
        { new: true, session }
    );

    // Create or update transaction record
    let transaction;
    if (existingTxn) {
        existingTxn.status = 'SUCCESS';
        existingTxn.balanceBeforePaise = balanceBefore;
        existingTxn.balanceAfterPaise = balanceAfter;
        existingTxn.completedAt = new Date();
        await existingTxn.save({ session });
        transaction = existingTxn;
    } else {
        [transaction] = await WalletTransaction.create(
            [
                {
                    walletId: wallet._id,
                    userId,
                    type: txnData.type || 'TOPUP',
                    direction: 'CREDIT',
                    amountPaise,
                    balanceBeforePaise: balanceBefore,
                    balanceAfterPaise: balanceAfter,
                    status: 'SUCCESS',
                    source: txnData.source || 'RAZORPAY',
                    referenceType: txnData.referenceType || 'RAZORPAY_ORDER',
                    referenceId: txnData.referenceId,
                    idempotencyKey: txnData.idempotencyKey,
                    meta: txnData.meta || {},
                    description: txnData.description || 'Wallet top-up',
                    adminId: txnData.adminId,
                    completedAt: new Date(),
                },
            ],
            session ? { session } : {}
        );
    }

    console.log(`[WalletService] Credited ${amountPaise} paise to user ${userId}. Balance: ${balanceBefore} -> ${balanceAfter}`);

    return { wallet: updatedWallet, transaction, alreadyProcessed: false };
};

/**
 * Debit wallet (deduct funds)
 * @param {string} userId - User's MongoDB ObjectId
 * @param {number} amountPaise - Amount to debit in paise
 * @param {object} txnData - Transaction data
 * @param {mongoose.ClientSession} session - MongoDB session for atomicity
 * @returns {Promise<{wallet: Wallet, transaction: WalletTransaction}>}
 */
const debitWallet = async (userId, amountPaise, txnData, session = null) => {
    // Session optional
    // if (!session) {
    //     throw new Error('Session required for atomic wallet operations');
    // }

    if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
        throw new Error('Amount must be a positive integer');
    }

    // Check idempotency
    const existingTxn = await WalletTransaction.findOne({
        idempotencyKey: txnData.idempotencyKey,
    }).session(session);

    if (existingTxn && existingTxn.status === 'SUCCESS') {
        console.log(`[WalletService] Idempotent return - debit already successful: ${txnData.idempotencyKey}`);
        const wallet = await Wallet.findOne({ userId }).session(session);
        return { wallet, transaction: existingTxn, alreadyProcessed: true };
    }

    // Get wallet
    const wallet = await Wallet.findOne({ userId }).session(session);

    if (!wallet) {
        throw new Error('Wallet not found');
    }

    if (wallet.status !== 'ACTIVE') {
        throw new Error('Wallet is not active');
    }

    if (wallet.balancePaise < amountPaise) {
        throw new Error('Insufficient wallet balance');
    }

    const balanceBefore = wallet.balancePaise;
    const balanceAfter = balanceBefore - amountPaise;

    // Update wallet balance atomically
    const updatedWallet = await Wallet.findOneAndUpdate(
        { _id: wallet._id, balancePaise: { $gte: amountPaise } },
        { $inc: { balancePaise: -amountPaise } },
        { new: true, session }
    );

    if (!updatedWallet) {
        throw new Error('Failed to debit - concurrent modification or insufficient balance');
    }

    // Create transaction record
    const [transaction] = await WalletTransaction.create(
        [
            {
                walletId: wallet._id,
                userId,
                type: txnData.type || 'DEBIT',
                direction: 'DEBIT',
                amountPaise,
                balanceBeforePaise: balanceBefore,
                balanceAfterPaise: balanceAfter,
                status: 'SUCCESS',
                source: txnData.source || 'ORDER',
                referenceType: txnData.referenceType || 'INVOICE',
                referenceId: txnData.referenceId,
                idempotencyKey: txnData.idempotencyKey,
                meta: txnData.meta || {},
                description: txnData.description || 'Wallet debit',
                adminId: txnData.adminId,
                invoiceId: txnData.invoiceId,
                completedAt: new Date(),
            },
        ],
        session ? { session } : {}
    );

    console.log(`[WalletService] Debited ${amountPaise} paise from user ${userId}. Balance: ${balanceBefore} -> ${balanceAfter}`);

    return { wallet: updatedWallet, transaction, alreadyProcessed: false };
};

/**
 * Create a pending transaction (for top-up before webhook)
 * @param {string} userId - User's MongoDB ObjectId
 * @param {number} amountPaise - Amount in paise
 * @param {object} txnData - Transaction data
 * @returns {Promise<WalletTransaction>}
 */
const createPendingTransaction = async (userId, amountPaise, txnData) => {
    const wallet = await getOrCreateWallet(userId);

    const transaction = await WalletTransaction.create({
        walletId: wallet._id,
        userId,
        type: 'TOPUP',
        direction: 'CREDIT',
        amountPaise,
        status: 'PENDING',
        source: 'RAZORPAY',
        referenceType: 'RAZORPAY_ORDER',
        referenceId: txnData.razorpayOrderId,
        idempotencyKey: txnData.idempotencyKey || `topup_${txnData.razorpayOrderId}`,
        meta: txnData.meta || {},
        description: 'Wallet top-up (pending payment)',
    });

    console.log(`[WalletService] Created pending transaction for ${amountPaise} paise, order: ${txnData.razorpayOrderId}`);

    return transaction;
};

/**
 * Get paginated transactions for a user
 * @param {string} userId - User's MongoDB ObjectId
 * @param {object} options - Pagination options
 * @returns {Promise<{transactions: WalletTransaction[], total: number, hasMore: boolean}>}
 */
const getTransactions = async (userId, options = {}) => {
    const { limit = 20, cursor, status } = options;

    const query = { userId };

    if (cursor) {
        query.createdAt = { $lt: new Date(cursor) };
    }

    if (status) {
        query.status = status;
    }

    const transactions = await WalletTransaction.find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .lean();

    const hasMore = transactions.length > limit;
    const result = hasMore ? transactions.slice(0, limit) : transactions;

    const total = await WalletTransaction.countDocuments({ userId });

    return {
        transactions: result,
        total,
        hasMore,
        nextCursor: hasMore ? result[result.length - 1].createdAt.toISOString() : null,
    };
};

/**
 * Admin: Get all wallets with optional search
 * @param {object} options - Search/pagination options
 * @returns {Promise<{wallets: Array, total: number}>}
 */
const getAllWallets = async (options = {}) => {
    const { search, limit = 50, skip = 0 } = options;

    let userQuery = {};
    if (search) {
        userQuery = {
            $or: [
                { email: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
            ],
        };
    }

    // First find matching users if search is provided
    const User = mongoose.model('User');
    let userIds = null;

    if (search) {
        const users = await User.find(userQuery).select('_id').lean();
        userIds = users.map((u) => u._id);
    }

    const walletQuery = userIds ? { userId: { $in: userIds } } : {};

    const wallets = await Wallet.find(walletQuery)
        .populate('userId', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    const total = await Wallet.countDocuments(walletQuery);

    return { wallets, total };
};

/**
 * Admin: Adjust wallet balance (credit or debit)
 * @param {string} adminId - Admin's MongoDB ObjectId
 * @param {string} userId - Target user's MongoDB ObjectId
 * @param {string} direction - 'CREDIT' or 'DEBIT'
 * @param {number} amountPaise - Amount in paise
 * @param {string} reason - Reason for adjustment
 * @returns {Promise<{wallet: Wallet, transaction: WalletTransaction}>}
 */
const adminAdjustBalance = async (adminId, userId, direction, amountPaise, reason) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const idempotencyKey = `admin_adj_${adminId}_${userId}_${Date.now()}`;
        const txnData = {
            type: 'ADJUSTMENT',
            source: 'ADMIN',
            referenceType: 'ADMIN_ADJUSTMENT',
            referenceId: `ADMIN_${adminId}_${Date.now()}`,
            idempotencyKey,
            description: reason || `Admin adjustment (${direction.toLowerCase()})`,
            adminId,
            meta: { adminId, reason, adjustedAt: new Date().toISOString() },
        };

        let result;
        if (direction === 'CREDIT') {
            result = await creditWallet(userId, amountPaise, txnData, session);
        } else if (direction === 'DEBIT') {
            result = await debitWallet(userId, amountPaise, txnData, session);
        } else {
            throw new Error('Invalid direction. Must be CREDIT or DEBIT');
        }

        await session.commitTransaction();
        console.log(`[WalletService] Admin ${adminId} adjusted user ${userId} wallet: ${direction} ${amountPaise} paise`);

        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

module.exports = {
    getOrCreateWallet,
    getBalance,
    findTransactionByIdempotencyKey,
    creditWallet,
    debitWallet,
    createPendingTransaction,
    getTransactions,
    getAllWallets,
    adminAdjustBalance,
};
