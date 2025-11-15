import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IEscrowTransaction, PaymentStatus, FulfillmentPaymentStatus, PayoutStatusEnum } from '../types';

const EscrowTransactionSchema = new Schema<IEscrowTransaction>({
  id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  orderId: {
    type: String,
    required: true,
    index: true
  },
  storeId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  customerPaymentAmount: {
    type: Number,
    required: true
  },
  fulfillmentCost: {
    type: Number,
    required: true
  },
  platformFee: {
    type: Number,
    required: true
  },
  storePayout: {
    type: Number,
    required: true
  },
  customerPaymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING
  },
  fulfillmentPaymentStatus: {
    type: String,
    enum: Object.values(FulfillmentPaymentStatus),
    default: FulfillmentPaymentStatus.PENDING
  },
  payoutStatus: {
    type: String,
    enum: Object.values(PayoutStatusEnum),
    default: PayoutStatusEnum.IN_ESCROW
  },
  stripePaymentIntentId: {
    type: String,
    default: null
  },
  stripeTransferId: {
    type: String,
    default: null
  },
  releasedToPayoutAt: {
    type: Date,
    default: null
  },
  paidOutAt: {
    type: Date,
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
  collection: 'escrow_transactions'
});

EscrowTransactionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const EscrowTransaction = mongoose.model<IEscrowTransaction>('EscrowTransaction', EscrowTransactionSchema);

