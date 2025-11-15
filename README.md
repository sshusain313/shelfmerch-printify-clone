# ShelfMerch - Print-on-Demand Platform

A modern print-on-demand platform clone inspired by Printify, built with React, Vite, and TypeScript.

## Quick Start

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `frontend` directory:
   ```bash
   cp .env.example .env
   ```

4. If using ngrok tunnel for development, add your tunnel host to `.env`:
   ```
   VITE_TUNNEL_HOST=your-ngrok-subdomain.ngrok-free.dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend` directory:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your MongoDB connection string:
   ```
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=shelfmerch
   PORT=8000
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   
   Or build and run in production:
   ```bash
   npm run build
   npm start
   ```

## Features

- 🎨 Custom product design tool
- 📦 Print-on-demand product catalog
- 🏪 Multi-store management
- 💰 Profit calculator
- 📊 Analytics dashboard
- 🌍 Global fulfillment network
- 🔗 E-commerce platform integrations

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide Icons

**Backend:**
- Node.js + Express
- TypeScript
- MongoDB with Mongoose

## Development

The frontend is configured to work with ngrok tunnels for local development. The `vite.config.ts` automatically configures:
- Allowed hosts
- HMR WebSocket over WSS
- Public origin

Make sure to set `VITE_TUNNEL_HOST` in your `.env` file when using ngrok.

## License

MIT
