// server.js - Main server file
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const downloadRouter = require('./routes/downloads');
const protocolRouter = require('./routes/protocol');
const { logAPIRequest } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'production' ? 10 : 100),
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));
app.use(compression());

// Custom logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

app.use(logAPIRequest);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? ['https://nova.app', 'https://www.nova.app', 'nova://'] 
      : ['http://localhost:3000', 'http://localhost:5173', 'nova://'];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Session-ID'],
};

app.use(cors(corsOptions));

// Apply rate limiting
app.use(limiter);
// Auth rate limiting will be applied selectively in route files

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    api_version: '1.0.0',
    status: 'operational',
    features: {
      authentication: true,
      downloads: true,
      user_management: true,
      protocol_handler: true,
      analytics: true
    },
    database_status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/downloads', downloadRouter);
app.use('/api/protocol', protocolRouter);

// Frontend integration endpoint for protocol handling
app.get('/protocol/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/protocol/${sessionId}`);
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Nova API Documentation',
    version: '1.0.0',
    endpoints: {
      authentication: {
        'POST /api/auth/register': 'Register new user with Discord',
        'POST /api/auth/login': 'Login with email/password',
        'POST /api/auth/login/discord': 'Login with Discord OAuth',
        'POST /api/auth/logout': 'Logout user',
        'GET /api/auth/me': 'Get current user info',
        'GET /api/auth/discord': 'Get Discord OAuth URL'
      },
      user_management: {
        'GET /api/user/profile': 'Get user profile',
        'PUT /api/user/profile': 'Update user profile',
        'GET /api/user/dashboard': 'Get dashboard data',
        'POST /api/user/optimization': 'Record optimization results',
        'GET /api/user/optimizations': 'Get optimization history',
        'GET /api/user/subscription': 'Get subscription info'
      },
      downloads: {
        'GET /api/downloads': 'Get all downloads',
        'GET /api/downloads/:product': 'Get product downloads',
        'POST /api/downloads/:id/download': 'Track download',
        'GET /api/downloads/stats/overview': 'Get download statistics'
      },
      protocol: {
        'POST /api/protocol/init': 'Initialize protocol session',
        'GET /api/protocol/:sessionId': 'Get session status',
        'POST /api/protocol/:sessionId/complete': 'Complete session'
      }
    },
    authentication: {
      method: 'JWT Token in HTTP-only cookie or Authorization header',
      format: 'Bearer <token>'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    available_endpoints: '/api/docs',
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  
  // Log error for monitoring
  if (process.env.NODE_ENV === 'production') {
    // Here you would integrate with error monitoring service
    console.error('Production error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation error', 
      details: error.message 
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({ 
      error: 'Invalid ID format' 
    });
  }
  
  if (error.name === 'MongoError' && error.code === 11000) {
    return res.status(409).json({ 
      error: 'Duplicate entry' 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    request_id: req.id || 'unknown',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Nova API Server running on port ${PORT}`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API docs: http://localhost:${PORT}/api/docs`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔧 Development endpoints:');
      console.log(`   Auth: http://localhost:${PORT}/api/auth/discord`);
      console.log(`   Downloads: http://localhost:${PORT}/api/downloads`);
      console.log(`   Status: http://localhost:${PORT}/api/status`);
    }
  });
};

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;