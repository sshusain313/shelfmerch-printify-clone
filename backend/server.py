from fastapi import FastAPI, APIRouter
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
class Wallet(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    balance: float = 0.0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class TransactionType(str, Enum):
    credit = "credit"
    debit = "debit"

class WalletTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    walletId: str
    userId: str
    type: TransactionType
    amount: float
    description: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    adminId: Optional[str] = None

class WalletCreditDebit(BaseModel):
    amount: float
    description: str
    adminId: str

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
async def get_wallets(userId: Optional[str] = None):
    query = {"userId": userId} if userId else {}
    wallets = await db.wallets.find(query).to_list(1000)
    return [Wallet(**wallet) for wallet in wallets]

@api_router.post("/wallets/{userId}/credit")
async def credit_wallet(userId: str, credit_data: WalletCreditDebit):
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
        type=TransactionType.credit,
        amount=credit_data.amount,
        description=credit_data.description,
        adminId=credit_data.adminId
    )
    await db.wallet_transactions.insert_one(transaction.dict())
    
    return {"success": True, "newBalance": new_balance}

@api_router.post("/wallets/{userId}/debit")
async def debit_wallet(userId: str, debit_data: WalletCreditDebit):
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
        type=TransactionType.debit,
        amount=debit_data.amount,
        description=debit_data.description,
        adminId=debit_data.adminId
    )
    await db.wallet_transactions.insert_one(transaction.dict())
    
    return {"success": True, "newBalance": new_balance}

@api_router.get("/wallets/{userId}/transactions")
async def get_wallet_transactions(userId: str):
    transactions = await db.wallet_transactions.find({"userId": userId}).sort("createdAt", -1).to_list(1000)
    return [WalletTransaction(**txn) for txn in transactions]

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
async def generate_invoice(invoice_data: InvoiceCreate):
    invoice = Invoice(**invoice_data.dict())
    await db.invoices.insert_one(invoice.dict())
    return invoice

@api_router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str):
    invoice = await db.invoices.find_one({"id": invoice_id})
    if not invoice:
        return {"error": "Invoice not found"}
    return Invoice(**invoice)

@api_router.patch("/invoices/{invoice_id}")
async def update_invoice(invoice_id: str, update_data: InvoiceUpdate):
    result = await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": {"status": update_data.status}}
    )
    if result.modified_count == 0:
        return {"success": False, "error": "Invoice not found"}
    return {"success": True}

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
