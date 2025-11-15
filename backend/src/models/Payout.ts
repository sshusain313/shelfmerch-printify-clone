import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IPayout, PayoutMethod, PayoutStatus } from '../types';

const PayoutSchema = new Schema<IPayout>({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  payoutId: {
    type: String,
    default: () => {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const random = uuidv4().replace(/-/g, '').substring(0, 5).toUpperCase();
      return `PO-${year}${month}-${random}`;
    },
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
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "USD"
  },
  payoutMethod: {
    type: String,
    enum: Object.values(PayoutMethod),
    required: true
  },
  bankAccount: {
    type: Schema.Types.Mixed,
    default: null
  },
  status: {
    type: String,
    enum: Object.values(PayoutStatus),
    default: PayoutStatus.PENDING
  },
  orderIds: {
    type: [String],
    default: []
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  processedDate: {
    type: Date,
    default: null
  },
  completedDate: {
    type: Date,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  },
  stripePayoutId: {
    type: String,
    default: null
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
  collection: 'payouts'
});

PayoutSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Payout = mongoose.model<IPayout>('Payout', PayoutSchema);

