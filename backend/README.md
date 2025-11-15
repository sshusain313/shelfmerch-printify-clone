# ShelfMerch Backend - MERN Stack

Node.js/Express backend with TypeScript and MongoDB for the ShelfMerch platform.

## Features

- ✅ Wallet management (credit/debit, balance tracking)
- ✅ Transaction history
- ✅ Escrow transactions for popup stores
- ✅ Payout management
- ✅ Invoice generation and management
- ✅ Audit logging
- ✅ RESTful API with Express
- ✅ TypeScript for type safety
- ✅ MongoDB with Mongoose ODM

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or cloud instance like MongoDB Atlas)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` file:
   ```
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=shelfmerch
   PORT=8000
   NODE_ENV=development
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

## Running the Server

### Development Mode
```bash
npm run dev
```
This uses `tsx` to run TypeScript directly with hot reload.

### Production Mode
```bash
npm run build
npm start
```

## API Endpoints

### Status
- `GET /api/` - Health check
- `POST /api/status` - Create status check
- `GET /api/status` - Get all status checks

### Wallets
- `GET /api/wallets` - Get wallets (query: userId, storeId, storeType)
- `GET /api/wallets/:userId/balance` - Get wallet balance
- `POST /api/wallets/:userId/credit` - Credit wallet
- `POST /api/wallets/:userId/debit` - Debit wallet
- `GET /api/wallets/:userId/transactions` - Get transactions
- `PATCH /api/wallets/:userId/payout-settings` - Update payout settings

### Escrow
- `POST /api/escrow/create` - Create escrow transaction
- `GET /api/escrow/:order_id` - Get escrow by order ID
- `POST /api/escrow/:escrow_id/release` - Release escrow to payout

### Payouts
- `GET /api/payouts` - Get payouts (query: userId, storeId, status)
- `POST /api/payouts/request` - Request payout (query: userId, storeId)
- `PATCH /api/payouts/:payout_id/status` - Update payout status

### Invoices
- `GET /api/invoices` - Get invoices (query: buyerId, sellerId, status, orderId)
- `POST /api/invoices/generate` - Generate invoice
- `GET /api/invoices/:invoice_id` - Get invoice by ID
- `PATCH /api/invoices/:invoice_id` - Update invoice

### Audit Logs
- `GET /api/audit-logs` - Get audit logs (query: adminId, action, targetType, startDate, endDate, limit)
- `GET /api/audit-logs/stats` - Get audit statistics

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── database.ts  # MongoDB connection
│   ├── controllers/     # Route controllers
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── server.ts        # Main server file
├── dist/                # Compiled JavaScript (generated)
├── .env.example         # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Development

The backend uses:
- **Express** for the web framework
- **Mongoose** for MongoDB ODM
- **TypeScript** for type safety
- **tsx** for running TypeScript in development

## License

MIT

