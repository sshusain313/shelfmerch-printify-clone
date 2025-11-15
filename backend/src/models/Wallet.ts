import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IWallet, StoreType, IPayoutSettings, IWalletMetadata } from '../types';

const BankAccountSchema = new Schema({
  accountHolderName: String,
  accountNumber: String,
  routingNumber: String,
  accountType: { type: String, default: "checking" },
  bankName: String,
  country: { type: String, default: "US" },
  currency: { type: String, default: "USD" }
}, { _id: false });

const PayoutSettingsSchema = new Schema({
  bankAccount: { type: BankAccountSchema, default: null },
  paypalEmail: { type: String, default: null },
  payoutSchedule: { type: String, enum: ["monthly", "on_demand"], default: "monthly" },
  minimumPayoutAmount: { type: Number, default: 25.00 },
  nextScheduledPayout: { type: Date, default: null }
}, { _id: false });

const WalletMetadataSchema = new Schema({
  totalTopUps: { type: Number, default: 0.0 },
  totalSpent: { type: Number, default: 0.0 },
  totalPayoutsReceived: { type: Number, default: 0.0 },
  lastTopUpDate: { type: Date, default: null },
  lastPayoutDate: { type: Date, default: null },
  lastTransactionDate: { type: Date, default: null }
}, { _id: false });

const WalletSchema = new Schema<IWallet>({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
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
  storeType: {
    type: String,
    enum: Object.values(StoreType),
    default: StoreType.CONNECTED
  },
  balance: {
    type: Number,
    default: 0.0
  },
  currency: {
    type: String,
    default: "USD"
  },
  lowBalanceThreshold: {
    type: Number,
    default: 20.0
  },
  payoutBalance: {
    type: Number,
    default: 0.0
  },
  pendingPayoutBalance: {
    type: Number,
    default: 0.0
  },
  lifetimeEarnings: {
    type: Number,
    default: 0.0
  },
  payoutSettings: {
    type: PayoutSettingsSchema,
    default: null
  },
  autoRecharge: {
    enabled: { type: Boolean, default: false },
    amount: { type: Number, default: 0.0 },
    triggerThreshold: { type: Number, default: 0.0 }
  },
  status: {
    type: String,
    default: "active"
  },
  metadata: {
    type: WalletMetadataSchema,
    default: () => ({})
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  collection: 'wallets'
});

WalletSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);

