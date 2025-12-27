/**
 * Wallet and Withdrawal Types
 * TypeScript types for wallet operations and withdrawal requests
 */

// Withdrawal request status lifecycle
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'FAILED';

// Transaction types
export type TransactionType = 'TOPUP' | 'DEBIT' | 'REFUND' | 'ADJUSTMENT' | 'WITHDRAWAL';

// Transaction direction
export type TransactionDirection = 'CREDIT' | 'DEBIT';

// Transaction status
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

// Payout method
export type PayoutMethod = 'UPI' | 'BANK_TRANSFER' | 'OTHER';

/**
 * Withdrawal request as returned from API
 */
export interface WithdrawalRequest {
    id: string;
    merchantId: string;
    merchantEmail?: string;
    merchantName?: string;
    amountPaise: number;
    amountRupees: string;
    currency: string;
    upiId: string;
    status: WithdrawalStatus;
    requestedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    paidAt?: string;
    rejectionReason?: string;
    payoutMethod: PayoutMethod;
    payoutReference?: string;
    payoutNotes?: string;
}

/**
 * Wallet summary including pending withdrawals
 */
export interface WalletSummary {
    balancePaise: number;
    balanceRupees: string;
    currency: string;
    status: 'ACTIVE' | 'LOCKED';
    pendingWithdrawalsPaise: number;
    pendingWithdrawalsRupees: string;
    availableForWithdrawalPaise: number;
    availableForWithdrawalRupees: string;
}

/**
 * Wallet transaction record
 */
export interface WalletTransaction {
    id: string;
    type: TransactionType;
    direction: TransactionDirection;
    amountPaise: number;
    amountRupees: string;
    status: TransactionStatus;
    source: string;
    referenceType: string;
    referenceId: string;
    description: string;
    balanceBeforePaise?: number;
    balanceAfterPaise?: number;
    createdAt: string;
    completedAt?: string;
}

/**
 * Withdrawal statistics for admin dashboard
 */
export interface WithdrawalStats {
    byStatus: Record<WithdrawalStatus, {
        count: number;
        totalPaise: number;
        totalRupees: string;
    }>;
    todayApproved: {
        count: number;
        totalPaise: number;
        totalRupees: string;
    };
    todayPaid: {
        count: number;
        totalPaise: number;
        totalRupees: string;
    };
}

/**
 * Create withdrawal request payload
 */
export interface CreateWithdrawalPayload {
    amountPaise: number;
    upiId: string;
}

/**
 * Reject withdrawal request payload
 */
export interface RejectWithdrawalPayload {
    reason: string;
}

/**
 * Mark withdrawal as paid payload
 */
export interface MarkPaidPayload {
    payoutReference: string;
    notes?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        total: number;
        limit: number;
        skip: number;
    };
}
