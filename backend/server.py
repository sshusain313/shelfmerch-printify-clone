from fastapi import FastAPI, APIRouter, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime
from typing import Optional
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Wallet Models
class StoreType(str, Enum):
    connected = "connected"
    popup = "popup"

class PayoutSchedule(str, Enum):
    monthly = "monthly"
    on_demand = "on_demand"

class BankAccount(BaseModel):
    accountHolderName: str
    accountNumber: str  # Should be encrypted in production
    routingNumber: str  # Should be encrypted in production
    accountType: str = "checking"  # checking or savings
    bankName: str
    country: str = "US"
    currency: str = "USD"

class PayoutSettings(BaseModel):
    bankAccount: Optional[BankAccount] = None
    paypalEmail: Optional[str] = None
    payoutSchedule: PayoutSchedule = PayoutSchedule.monthly
    minimumPayoutAmount: float = 25.00
    nextScheduledPayout: Optional[datetime] = None

class WalletMetadata(BaseModel):
    totalTopUps: float = 0.0
    totalSpent: float = 0.0
    totalPayoutsReceived: float = 0.0
    lastTopUpDate: Optional[datetime] = None
    lastPayoutDate: Optional[datetime] = None
    lastTransactionDate: Optional[datetime] = None

class Wallet(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    storeId: Optional[str] = None
    storeType: StoreType = StoreType.connected
    
    # Fulfillment balance
    balance: float = 0.0
    currency: str = "USD"
    lowBalanceThreshold: float = 20.0
    
    # Payout balance (for popup stores)
    payoutBalance: float = 0.0
    pendingPayoutBalance: float = 0.0
    lifetimeEarnings: float = 0.0
    
    # Payout settings
    payoutSettings: Optional[PayoutSettings] = None
    
    # Auto recharge
    autoRecharge: dict = {"enabled": False, "amount": 0.0, "triggerThreshold": 0.0}
    
    status: str = "active"
    metadata: WalletMetadata = Field(default_factory=WalletMetadata)
    
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class TransactionType(str, Enum):
    credit = "credit"
    debit = "debit"

class TransactionCategory(str, Enum):
    fulfillment = "fulfillment"
    top_up = "top_up"
    payout = "payout"
    customer_payment = "customer_payment"
    refund = "refund"
    adjustment = "adjustment"
    platform_fee = "platform_fee"

class BalanceAffected(str, Enum):
    wallet = "wallet"
    payout = "payout"
    both = "both"

class WalletTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transactionId: str = Field(default_factory=lambda: f"TXN-{uuid.uuid4().hex[:12].upper()}")
    walletId: str
    userId: str
    storeId: Optional[str] = None
    
    category: TransactionCategory
    type: TransactionType
    amount: float
    balanceBefore: float = 0.0
    balanceAfter: float = 0.0
    
    affectsBalance: BalanceAffected = BalanceAffected.wallet
    
    orderId: Optional[str] = None
    paymentMethodId: Optional[str] = None
    payoutId: Optional[str] = None
    escrowTransactionId: Optional[str] = None
    
    status: str = "completed"
    description: str
    failureReason: Optional[str] = None
    
    metadata: dict = {}
    
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    completedAt: Optional[datetime] = None
    adminId: Optional[str] = None

class WalletCreditDebit(BaseModel):
    amount: float
    description: str
    adminId: str
    category: TransactionCategory = TransactionCategory.adjustment

# Escrow Models (for popup stores)
class PaymentStatus(str, Enum):
    pending = "pending"
    captured = "captured"
    refunded = "refunded"
    failed = "failed"

class FulfillmentPaymentStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"

class PayoutStatusEnum(str, Enum):
    in_escrow = "in_escrow"
    released = "released"
    paid_out = "paid_out"

class EscrowTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    orderId: str
    storeId: str
    userId: str
    
    customerPaymentAmount: float
    fulfillmentCost: float
    platformFee: float
    storePayout: float
    
    customerPaymentStatus: PaymentStatus = PaymentStatus.pending
    fulfillmentPaymentStatus: FulfillmentPaymentStatus = FulfillmentPaymentStatus.pending
    payoutStatus: PayoutStatusEnum = PayoutStatusEnum.in_escrow
    
    stripePaymentIntentId: Optional[str] = None
    stripeTransferId: Optional[str] = None
    
    releasedToPayoutAt: Optional[datetime] = None
    paidOutAt: Optional[datetime] = None
    
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

# Payout Models
class PayoutMethod(str, Enum):
    bank_transfer = "bank_transfer"
    paypal = "paypal"

class PayoutStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"

class Payout(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payoutId: str = Field(default_factory=lambda: f"PO-{datetime.utcnow().strftime('%Y%m')}-{uuid.uuid4().hex[:5].upper()}")
    userId: str
    storeId: str
    
    amount: float
    currency: str = "USD"
    
    payoutMethod: PayoutMethod
    bankAccount: Optional[dict] = None
    
    status: PayoutStatus = PayoutStatus.pending
    
    orderIds: List[str] = []
    
    scheduledDate: Optional[datetime] = None
    processedDate: Optional[datetime] = None
    completedDate: Optional[datetime] = None
    
    failureReason: Optional[str] = None
    stripePayoutId: Optional[str] = None
    
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class PayoutCreate(BaseModel):
    amount: float
    payoutMethod: PayoutMethod
    bankAccountId: Optional[str] = None

# Invoice Models
class InvoiceStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    unpaid = "unpaid"
    cancelled = "cancelled"

class InvoiceItem(BaseModel):
    productId: str
    productName: str
    quantity: int
    price: float
    total: float

class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    orderId: str
    buyerId: str
    sellerId: str
    items: List[InvoiceItem]
    subtotal: float
    tax: float = 0.0
    total: float
    status: InvoiceStatus = InvoiceStatus.pending
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    pdfUrl: Optional[str] = None

class InvoiceCreate(BaseModel):
    orderId: str
    buyerId: str
    sellerId: str
    items: List[InvoiceItem]
    subtotal: float
    tax: float = 0.0
    total: float

class InvoiceUpdate(BaseModel):
    status: InvoiceStatus

# Audit Log Models
class AuditAction(str, Enum):
    wallet_credit = "wallet_credit"
    wallet_debit = "wallet_debit"
    invoice_create = "invoice_create"
    invoice_update = "invoice_update"
    wallet_view = "wallet_view"
    invoice_view = "invoice_view"

class AuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    adminId: str
    action: AuditAction
    targetId: str  # walletId or invoiceId
    targetType: str  # 'wallet' or 'invoice'
    details: dict
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Helper function to create audit log
async def create_audit_log(
    adminId: str,
    action: AuditAction,
    targetId: str,
    targetType: str,
    details: dict,
    request: Request
):
    audit_log = AuditLog(
        adminId=adminId,
        action=action,
        targetId=targetId,
        targetType=targetType,
        details=details,
        ipAddress=request.client.host if request.client else None,
        userAgent=request.headers.get("user-agent")
    )
    await db.audit_logs.insert_one(audit_log.dict())
    return audit_log

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Wallet Routes
@api_router.get("/wallets")
async def get_wallets(
    userId: Optional[str] = None,
    storeId: Optional[str] = None,
    storeType: Optional[str] = None
):
    query = {}
    if userId:
        query["userId"] = userId
    if storeId:
        query["storeId"] = storeId
    if storeType:
        query["storeType"] = storeType
    
    wallets = await db.wallets.find(query).to_list(1000)
    return [Wallet(**wallet) for wallet in wallets]

@api_router.get("/wallets/{userId}/balance")
async def get_wallet_balance(userId: str, storeId: Optional[str] = None):
    query = {"userId": userId}
    if storeId:
        query["storeId"] = storeId
    
    wallet = await db.wallets.find_one(query)
    if not wallet:
        return {"balance": 0.0, "payoutBalance": 0.0, "pendingPayoutBalance": 0.0}
    
    return {
        "balance": wallet.get("balance", 0.0),
        "payoutBalance": wallet.get("payoutBalance", 0.0),
        "pendingPayoutBalance": wallet.get("pendingPayoutBalance", 0.0),
        "lifetimeEarnings": wallet.get("lifetimeEarnings", 0.0),
        "currency": wallet.get("currency", "USD")
    }

@api_router.post("/wallets/{userId}/credit")
async def credit_wallet(userId: str, credit_data: WalletCreditDebit, request: Request):
    # Get or create wallet
    wallet = await db.wallets.find_one({"userId": userId})
    if not wallet:
        new_wallet = Wallet(userId=userId, balance=0.0)
        await db.wallets.insert_one(new_wallet.dict())
        wallet = new_wallet.dict()
    
    # Update balance
    new_balance = wallet["balance"] + credit_data.amount
    await db.wallets.update_one(
        {"userId": userId},
        {"$set": {"balance": new_balance, "updatedAt": datetime.utcnow()}}
    )
    
    # Create transaction
    transaction = WalletTransaction(
        walletId=wallet["id"],
        userId=userId,
        storeId=wallet.get("storeId"),
        category=credit_data.category,
        type=TransactionType.credit,
        amount=credit_data.amount,
        balanceBefore=wallet["balance"],
        balanceAfter=new_balance,
        description=credit_data.description,
        adminId=credit_data.adminId,
        completedAt=datetime.utcnow()
    )
    await db.wallet_transactions.insert_one(transaction.dict())
    
    # Create audit log
    await create_audit_log(
        adminId=credit_data.adminId,
        action=AuditAction.wallet_credit,
        targetId=wallet["id"],
        targetType="wallet",
        details={
            "userId": userId,
            "amount": credit_data.amount,
            "description": credit_data.description,
            "newBalance": new_balance
        },
        request=request
    )
    
    return {"success": True, "newBalance": new_balance}

@api_router.post("/wallets/{userId}/debit")
async def debit_wallet(userId: str, debit_data: WalletCreditDebit, request: Request):
    # Get wallet
    wallet = await db.wallets.find_one({"userId": userId})
    if not wallet:
        return {"success": False, "error": "Wallet not found"}
    
    # Check sufficient balance
    if wallet["balance"] < debit_data.amount:
        return {"success": False, "error": "Insufficient balance"}
    
    # Update balance
    new_balance = wallet["balance"] - debit_data.amount
    await db.wallets.update_one(
        {"userId": userId},
        {"$set": {"balance": new_balance, "updatedAt": datetime.utcnow()}}
    )
    
    # Create transaction
    transaction = WalletTransaction(
        walletId=wallet["id"],
        userId=userId,
        storeId=wallet.get("storeId"),
        category=debit_data.category,
        type=TransactionType.debit,
        amount=debit_data.amount,
        balanceBefore=wallet["balance"],
        balanceAfter=new_balance,
        description=debit_data.description,
        adminId=debit_data.adminId,
        completedAt=datetime.utcnow()
    )
    await db.wallet_transactions.insert_one(transaction.dict())
    
    # Create audit log
    await create_audit_log(
        adminId=debit_data.adminId,
        action=AuditAction.wallet_debit,
        targetId=wallet["id"],
        targetType="wallet",
        details={
            "userId": userId,
            "amount": debit_data.amount,
            "description": debit_data.description,
            "newBalance": new_balance
        },
        request=request
    )
    
    return {"success": True, "newBalance": new_balance}

@api_router.get("/wallets/{userId}/transactions")
async def get_wallet_transactions(
    userId: str,
    category: Optional[str] = None,
    storeId: Optional[str] = None,
    affectsBalance: Optional[str] = None
):
    query = {"userId": userId}
    if category:
        query["category"] = category
    if storeId:
        query["storeId"] = storeId
    if affectsBalance:
        query["affectsBalance"] = affectsBalance
    
    transactions = await db.wallet_transactions.find(query).sort("createdAt", -1).to_list(1000)
    return [WalletTransaction(**txn) for txn in transactions]

# Escrow Routes (for popup stores)
@api_router.post("/escrow/create")
async def create_escrow_transaction(escrow_data: EscrowTransaction, request: Request):
    await db.escrow_transactions.insert_one(escrow_data.dict())
    return {"success": True, "escrowId": escrow_data.id}

@api_router.get("/escrow/{order_id}")
async def get_escrow_transaction(order_id: str):
    escrow = await db.escrow_transactions.find_one({"orderId": order_id})
    if not escrow:
        return {"error": "Escrow transaction not found"}
    return EscrowTransaction(**escrow)

@api_router.post("/escrow/{escrow_id}/release")
async def release_escrow_to_payout(escrow_id: str, request: Request):
    escrow = await db.escrow_transactions.find_one({"id": escrow_id})
    if not escrow:
        return {"success": False, "error": "Escrow not found"}
    
    # Update wallet payout balance
    wallet = await db.wallets.find_one({"userId": escrow["userId"], "storeId": escrow["storeId"]})
    if wallet:
        new_payout_balance = wallet.get("payoutBalance", 0.0) + escrow["storePayout"]
        new_lifetime_earnings = wallet.get("lifetimeEarnings", 0.0) + escrow["storePayout"]
        
        await db.wallets.update_one(
            {"id": wallet["id"]},
            {
                "$set": {
                    "payoutBalance": new_payout_balance,
                    "pendingPayoutBalance": wallet.get("pendingPayoutBalance", 0.0) - escrow["storePayout"],
                    "lifetimeEarnings": new_lifetime_earnings,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        # Create transaction record
        transaction = WalletTransaction(
            walletId=wallet["id"],
            userId=escrow["userId"],
            storeId=escrow["storeId"],
            category=TransactionCategory.customer_payment,
            type=TransactionType.credit,
            amount=escrow["storePayout"],
            balanceBefore=wallet.get("payoutBalance", 0.0),
            balanceAfter=new_payout_balance,
            affectsBalance=BalanceAffected.payout,
            orderId=escrow["orderId"],
            escrowTransactionId=escrow_id,
            description=f"Payout from order {escrow['orderId']}",
            completedAt=datetime.utcnow()
        )
        await db.wallet_transactions.insert_one(transaction.dict())
    
    # Update escrow status
    await db.escrow_transactions.update_one(
        {"id": escrow_id},
        {
            "$set": {
                "payoutStatus": PayoutStatusEnum.released,
                "releasedToPayoutAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    return {"success": True, "newPayoutBalance": new_payout_balance}

# Payout Routes
@api_router.get("/payouts")
async def get_payouts(
    userId: Optional[str] = None,
    storeId: Optional[str] = None,
    status: Optional[str] = None
):
    query = {}
    if userId:
        query["userId"] = userId
    if storeId:
        query["storeId"] = storeId
    if status:
        query["status"] = status
    
    payouts = await db.payouts.find(query).sort("createdAt", -1).to_list(1000)
    return [Payout(**payout) for payout in payouts]

@api_router.post("/payouts/request")
async def request_payout(payout_data: PayoutCreate, userId: str, storeId: str, request: Request):
    # Get wallet
    wallet = await db.wallets.find_one({"userId": userId, "storeId": storeId})
    if not wallet:
        return {"success": False, "error": "Wallet not found"}
    
    # Check minimum payout amount
    min_payout = wallet.get("payoutSettings", {}).get("minimumPayoutAmount", 25.0)
    if payout_data.amount < min_payout:
        return {"success": False, "error": f"Minimum payout amount is ${min_payout}"}
    
    # Check sufficient balance
    if wallet.get("payoutBalance", 0.0) < payout_data.amount:
        return {"success": False, "error": "Insufficient payout balance"}
    
    # Create payout record
    payout = Payout(
        userId=userId,
        storeId=storeId,
        amount=payout_data.amount,
        payoutMethod=payout_data.payoutMethod,
        bankAccount=wallet.get("payoutSettings", {}).get("bankAccount", {}) if payout_data.payoutMethod == PayoutMethod.bank_transfer else None,
        scheduledDate=datetime.utcnow()
    )
    await db.payouts.insert_one(payout.dict())
    
    # Deduct from payout balance
    new_payout_balance = wallet["payoutBalance"] - payout_data.amount
    await db.wallets.update_one(
        {"id": wallet["id"]},
        {
            "$set": {
                "payoutBalance": new_payout_balance,
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    # Create transaction
    transaction = WalletTransaction(
        walletId=wallet["id"],
        userId=userId,
        storeId=storeId,
        category=TransactionCategory.payout,
        type=TransactionType.debit,
        amount=payout_data.amount,
        balanceBefore=wallet["payoutBalance"],
        balanceAfter=new_payout_balance,
        affectsBalance=BalanceAffected.payout,
        payoutId=payout.id,
        description=f"Payout to {payout_data.payoutMethod}",
        completedAt=datetime.utcnow()
    )
    await db.wallet_transactions.insert_one(transaction.dict())
    
    return {"success": True, "payoutId": payout.payoutId, "newPayoutBalance": new_payout_balance}

@api_router.patch("/payouts/{payout_id}/status")
async def update_payout_status(payout_id: str, status: PayoutStatus, failureReason: Optional[str] = None):
    update_data = {
        "status": status,
        "updatedAt": datetime.utcnow()
    }
    
    if status == PayoutStatus.processing:
        update_data["processedDate"] = datetime.utcnow()
    elif status == PayoutStatus.completed:
        update_data["completedDate"] = datetime.utcnow()
    elif status == PayoutStatus.failed:
        update_data["failureReason"] = failureReason
    
    result = await db.payouts.update_one(
        {"payoutId": payout_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        return {"success": False, "error": "Payout not found"}
    
    return {"success": True}

@api_router.patch("/wallets/{userId}/payout-settings")
async def update_payout_settings(userId: str, settings: PayoutSettings, storeId: Optional[str] = None):
    query = {"userId": userId}
    if storeId:
        query["storeId"] = storeId
    
    result = await db.wallets.update_one(
        query,
        {
            "$set": {
                "payoutSettings": settings.dict(),
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        return {"success": False, "error": "Wallet not found"}
    
    return {"success": True}

# Invoice Routes
@api_router.get("/invoices")
async def get_invoices(
    buyerId: Optional[str] = None,
    sellerId: Optional[str] = None,
    status: Optional[str] = None,
    orderId: Optional[str] = None
):
    query = {}
    if buyerId:
        query["buyerId"] = buyerId
    if sellerId:
        query["sellerId"] = sellerId
    if status:
        query["status"] = status
    if orderId:
        query["orderId"] = orderId
    
    invoices = await db.invoices.find(query).sort("createdAt", -1).to_list(1000)
    return [Invoice(**invoice) for invoice in invoices]

@api_router.post("/invoices/generate", response_model=Invoice)
async def generate_invoice(invoice_data: InvoiceCreate, request: Request, adminId: str = "system"):
    invoice = Invoice(**invoice_data.dict())
    await db.invoices.insert_one(invoice.dict())
    
    # Create audit log
    await create_audit_log(
        adminId=adminId,
        action=AuditAction.invoice_create,
        targetId=invoice.id,
        targetType="invoice",
        details={
            "orderId": invoice.orderId,
            "buyerId": invoice.buyerId,
            "sellerId": invoice.sellerId,
            "total": invoice.total
        },
        request=request
    )
    
    return invoice

@api_router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str):
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        return {"error": "Invoice not found"}
    return Invoice(**invoice)

@api_router.patch("/invoices/{invoice_id}")
async def update_invoice(invoice_id: str, update_data: InvoiceUpdate, request: Request, adminId: str = "system"):
    # Get invoice before update
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        return {"success": False, "error": "Invoice not found"}
    
    old_status = invoice.get("status")
    
    result = await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": {"status": update_data.status}}
    )
    
    if result.modified_count == 0:
        return {"success": False, "error": "Invoice not found"}
    
    # Create audit log
    await create_audit_log(
        adminId=adminId,
        action=AuditAction.invoice_update,
        targetId=invoice_id,
        targetType="invoice",
        details={
            "oldStatus": old_status,
            "newStatus": update_data.status,
            "orderId": invoice.get("orderId")
        },
        request=request
    )
    
    return {"success": True}

# Audit Log Routes
@api_router.get("/audit-logs")
async def get_audit_logs(
    adminId: Optional[str] = None,
    action: Optional[str] = None,
    targetType: Optional[str] = None,
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    limit: int = 100
):
    query = {}
    if adminId:
        query["adminId"] = adminId
    if action:
        query["action"] = action
    if targetType:
        query["targetType"] = targetType
    if startDate or endDate:
        query["timestamp"] = {}
        if startDate:
            query["timestamp"]["$gte"] = datetime.fromisoformat(startDate)
        if endDate:
            query["timestamp"]["$lte"] = datetime.fromisoformat(endDate)
    
    logs = await db.audit_logs.find(query).sort("timestamp", -1).limit(limit).to_list(limit)
    return [AuditLog(**log) for log in logs]

@api_router.get("/audit-logs/stats")
async def get_audit_stats():
    total_logs = await db.audit_logs.count_documents({})
    
    # Count by action type
    action_pipeline = [
        {"$group": {"_id": "$action", "count": {"$sum": 1}}}
    ]
    action_stats = await db.audit_logs.aggregate(action_pipeline).to_list(100)
    
    # Count by admin
    admin_pipeline = [
        {"$group": {"_id": "$adminId", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    admin_stats = await db.audit_logs.aggregate(admin_pipeline).to_list(10)
    
    return {
        "totalLogs": total_logs,
        "byAction": {stat["_id"]: stat["count"] for stat in action_stats},
        "topAdmins": [{"adminId": stat["_id"], "count": stat["count"]} for stat in admin_stats]
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
