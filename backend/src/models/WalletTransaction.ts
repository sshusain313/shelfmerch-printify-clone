import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IWalletTransaction, TransactionType, TransactionCategory, BalanceAffected } from '../types';

const WalletTransactionSchema = new Schema<IWalletTransaction>({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  transactionId: {
    type: String,
    default: () => `TXN-${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`,
    unique: true,
    required: true
  },
  walletId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  storeId: {
    type: String,
    default: null,
    index: true
  },
  category: {
    type: String,
    enum: Object.values(TransactionCategory),
    required: true
  },
  type: {
    type: String,
    enum: Object.values(TransactionType),
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    default: 0.0
  },
  balanceAfter: {
    type: Number,
    default: 0.0
  },
  affectsBalance: {
    type: String,
    enum: Object.values(BalanceAffected),
    default: BalanceAffected.WALLET
  },
  orderId: {
    type: String,
    default: null
  },
  paymentMethodId: {
    type: String,
    default: null
  },
  payoutId: {
    type: String,
    default: null
  },
  escrowTransactionId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    default: "completed"
  },
  description: {
    type: String,
    required: true
  },
  failureReason: {
    type: String,
    default: null
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  adminId: {
    type: String,
    default: null
  }
}, {
  timestamps: false,
  collection: 'wallet_transactions'
});

export const WalletTransaction = mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);

