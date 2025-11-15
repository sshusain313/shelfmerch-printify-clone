import { Document } from 'mongoose';

// Status Check Types
export interface IStatusCheck extends Document {
  id: string;
  client_name: string;
  timestamp: Date;
}

export interface IStatusCheckCreate {
  client_name: string;
}

// Wallet Types
export enum StoreType {
  CONNECTED = "connected",
  POPUP = "popup"
}

export enum PayoutSchedule {
  MONTHLY = "monthly",
  ON_DEMAND = "on_demand"
}

export interface IBankAccount {
  accountHolderName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: string; // "checking" or "savings"
  bankName: string;
  country: string;
  currency: string;
}

export interface IPayoutSettings {
  bankAccount?: IBankAccount | null;
  paypalEmail?: string | null;
  payoutSchedule: PayoutSchedule;
  minimumPayoutAmount: number;
  nextScheduledPayout?: Date | null;
}

export interface IWalletMetadata {
  totalTopUps: number;
  totalSpent: number;
  totalPayoutsReceived: number;
  lastTopUpDate?: Date | null;
  lastPayoutDate?: Date | null;
  lastTransactionDate?: Date | null;
}

export interface IWallet extends Document {
  id: string;
  userId: string;
  storeId?: string | null;
  storeType: StoreType;
  balance: number;
  currency: string;
  lowBalanceThreshold: number;
  payoutBalance: number;
  pendingPayoutBalance: number;
  lifetimeEarnings: number;
  payoutSettings?: IPayoutSettings | null;
  autoRecharge: {
    enabled: boolean;
    amount: number;
    triggerThreshold: number;
  };
  status: string;
  metadata: IWalletMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionType {
  CREDIT = "credit",
  DEBIT = "debit"
}

export enum TransactionCategory {
  FULFILLMENT = "fulfillment",
  TOP_UP = "top_up",
  PAYOUT = "payout",
  CUSTOMER_PAYMENT = "customer_payment",
  REFUND = "refund",
  ADJUSTMENT = "adjustment",
  PLATFORM_FEE = "platform_fee"
}

export enum BalanceAffected {
  WALLET = "wallet",
  PAYOUT = "payout",
  BOTH = "both"
}

export interface IWalletTransaction extends Document {
  id: string;
  transactionId: string;
  walletId: string;
  userId: string;
  storeId?: string | null;
  category: TransactionCategory;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  affectsBalance: BalanceAffected;
  orderId?: string | null;
  paymentMethodId?: string | null;
  payoutId?: string | null;
  escrowTransactionId?: string | null;
  status: string;
  description: string;
  failureReason?: string | null;
  metadata: Record<string, any>;
  createdAt: Date;
  completedAt?: Date | null;
  adminId?: string | null;
}

export interface IWalletCreditDebit {
  amount: number;
  description: string;
  adminId: string;
  category?: TransactionCategory;
}

// Escrow Types
export enum PaymentStatus {
  PENDING = "pending",
  CAPTURED = "captured",
  REFUNDED = "refunded",
  FAILED = "failed"
}

export enum FulfillmentPaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed"
}

export enum PayoutStatusEnum {
  IN_ESCROW = "in_escrow",
  RELEASED = "released",
  PAID_OUT = "paid_out"
}

export interface IEscrowTransaction extends Document {
  id: string;
  orderId: string;
  storeId: string;
  userId: string;
  customerPaymentAmount: number;
  fulfillmentCost: number;
  platformFee: number;
  storePayout: number;
  customerPaymentStatus: PaymentStatus;
  fulfillmentPaymentStatus: FulfillmentPaymentStatus;
  payoutStatus: PayoutStatusEnum;
  stripePaymentIntentId?: string | null;
  stripeTransferId?: string | null;
  releasedToPayoutAt?: Date | null;
  paidOutAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Payout Types
export enum PayoutMethod {
  BANK_TRANSFER = "bank_transfer",
  PAYPAL = "paypal"
}

export enum PayoutStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled"
}

export interface IPayout extends Document {
  id: string;
  payoutId: string;
  userId: string;
  storeId: string;
  amount: number;
  currency: string;
  payoutMethod: PayoutMethod;
  bankAccount?: Record<string, any> | null;
  status: PayoutStatus;
  orderIds: string[];
  scheduledDate?: Date | null;
  processedDate?: Date | null;
  completedDate?: Date | null;
  failureReason?: string | null;
  stripePayoutId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayoutCreate {
  amount: number;
  payoutMethod: PayoutMethod;
  bankAccountId?: string | null;
}

// Invoice Types
export enum InvoiceStatus {
  PENDING = "pending",
  PAID = "paid",
  UNPAID = "unpaid",
  CANCELLED = "cancelled"
}

export interface IInvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IInvoice extends Document {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  items: IInvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  createdAt: Date;
  pdfUrl?: string | null;
}

export interface IInvoiceCreate {
  orderId: string;
  buyerId: string;
  sellerId: string;
  items: IInvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface IInvoiceUpdate {
  status: InvoiceStatus;
}

// Audit Log Types
export enum AuditAction {
  WALLET_CREDIT = "wallet_credit",
  WALLET_DEBIT = "wallet_debit",
  INVOICE_CREATE = "invoice_create",
  INVOICE_UPDATE = "invoice_update",
  WALLET_VIEW = "wallet_view",
  INVOICE_VIEW = "invoice_view"
}

export interface IAuditLog extends Document {
  id: string;
  adminId: string;
  action: AuditAction;
  targetId: string;
  targetType: string;
  details: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp: Date;
}

