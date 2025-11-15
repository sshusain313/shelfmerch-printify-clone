import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IInvoice, InvoiceStatus, IInvoiceItem } from '../types';

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  productId: String,
  productName: String,
  quantity: Number,
  price: Number,
  total: Number
}, { _id: false });

const InvoiceSchema = new Schema<IInvoice>({
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
  buyerId: {
    type: String,
    required: true,
    index: true
  },
  sellerId: {
    type: String,
    required: true,
    index: true
  },
  items: {
    type: [InvoiceItemSchema],
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0.0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(InvoiceStatus),
    default: InvoiceStatus.PENDING
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  pdfUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: false,
  collection: 'invoices'
});

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);

