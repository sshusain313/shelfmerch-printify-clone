const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGO_URL'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('\n❌ ERROR: Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n📝 Please create a .env file in the backend directory with these variables.');
  console.error('💡 Run "node generate-secrets.js" to generate secure JWT secrets.\n');
  process.exit(1);
}

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const variantRoutes = require('./routes/variants');
const variantOptionsRoutes = require('./routes/variantOptions');
const catalogueFieldsRoutes = require('./routes/catalogueFields');
const uploadRoutes = require('./routes/upload');
const assetsRoutes = require('./routes/assets');
const storeRoutes = require('./routes/stores');
const storeProductsRoutes = require('./routes/storeProducts');

// Initialize Express app
const app = express();

// CORS configuration - MUST BE FIRST
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
      : [
          'http://localhost:5173', 
          'http://localhost:3000', 
          'http://localhost:8080', 
          'http://localhost:5174',
          'http://localhost:5175',
          'http://localhost:4173'
        ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        console.log(`✓ CORS allowed for origin: ${origin}`);
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✓ CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'],
  preflightContinue: false
};

// Apply CORS middleware (handles preflight OPTIONS requests automatically)
app.use(cors(corsOptions));

// Security middleware (after CORS)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Body parser middleware - Increased limit for base64 images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parser
app.use(cookieParser());

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Rate limiting (skip for OPTIONS requests)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 6000, // limit each IP to 1000 requests per windowMs (increased from 100)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS' // Skip rate limiting for preflight
});

app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`Origin: ${req.headers.origin || 'none'}`);
  if (req.method === 'OPTIONS') {
    console.log('Preflight request received');
  }
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    // Don't log full body for product routes (too large with base64 images)
    if (req.path.includes('/products')) {
      console.log(`Body size: ${JSON.stringify(req.body).length} characters`);
    } else {
      console.log(`Body:`, req.body);
    }
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/variant-options', variantOptionsRoutes);
app.use('/api/catalogue-fields', catalogueFieldsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/store-products', storeProductsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message || err);
  if (err.stack && process.env.NODE_ENV === 'development') {
    console.error('Error stack:', err.stack);
  }

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    const dbName = process.env.DB_NAME;

    if (!mongoUrl) {
      throw new Error('MONGO_URL environment variable is not set');
    }

    const connectionString = dbName 
      ? `${mongoUrl}/${dbName}?retryWrites=true&w=majority`
      : `${mongoUrl}?retryWrites=true&w=majority`;

    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('Unhandled Promise Rejection:', err);
  console.error('Stack:', err.stack);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Stack:', err.stack);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, 'localhost', () => {
      const address = server.address();
      console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log(`✅ Server listening on: ${JSON.stringify(address)}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        throw error;
      }
    });

    // Increase server timeout for large requests
    server.timeout = 30000;

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

