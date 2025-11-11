/**
 * Production-Ready Express API Server
 * 
 * This server provides a secure, performant API with:
 * - Supabase integration
 * - Swagger API documentation
 * - Authentication middleware
 * - Rate limiting and security headers
 * - CORS support
 * - Request logging
 * - Static file serving for SPA
 * - Comprehensive error handling
 */

require('dotenv').config({ path: ['.env.local', '.env'] });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./utils/swagger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const profileRoutes = require('./routes/profiles');
const healthRoutes = require('./routes/health');
const inventoryRoutes = require('./routes/inventory');
const categoriesRoutes = require('./routes/categories');
const departmentsRoutes = require('./routes/departments');
const activityLogRoutes = require('./routes/activity-log');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Trust proxy - must be set before rate limiter to properly identify clients
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration - allow frontend domain and localhost for development
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'https://phpstack-868870-5982515.cloudwaysapps.com',
      'https://topapi-production.up.railway.app',
      'https://inv.topanimebar.com',
      'http://localhost:3000',
      'http://localhost:4000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:4000'
    ];

// Allow origins from the CORS_ORIGINS list and any subdomain of github.dev
// We use a function for `origin` to support dynamic checks (including wildcard subdomains)
const corsOptions = {
  origin: (origin, callback) => {
    // If no origin (e.g., same-origin or server-to-server requests), allow
    if (!origin) return callback(null, true);

    // Allow explicit origins from the env/config list
    if (corsOrigins && corsOrigins.includes(origin)) return callback(null, true);

    // Allow any http(s) subdomain of github.dev, e.g. <user>.github.dev or <repo>.github.dev
    const githubDevPattern = /^https?:\/\/[A-Za-z0-9-._]+\.github\.dev(?::\d+)?$/i;
    if (githubDevPattern.test(origin)) return callback(null, true);

    // Otherwise reject
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};
app.use((req, res, next) => {
  // Custom CORS handling middleware that delegates to the cors package
  // This keeps logging behaviour intact while using the dynamic origin function above.
  cors(corsOptions)(req, res, (err) => {
    if (err) {
      // When origin is not allowed, respond with 403 and a clear message
      res.status(403).json({ error: 'CORS error: origin not allowed' });
      return;
    }
    next();
  });
});

// Request logging
if (NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Additional request logging for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${req.get('origin') || 'N/A'}`);
  next();
});

// Log CORS configuration on startup
console.log(`🌐 CORS Origins: ${corsOrigins.join(', ')}`);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// API Documentation - Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Topapi API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// API Documentation - JSON Schema
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/activity-log', activityLogRoutes);

// Serve static files for frontend SPA
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback - serve index.html for all non-API routes
app.use((req, res, next) => {
  // Skip if it's an API route or documentation route
  if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
    return next();
  }
  
  // Try to serve index.html for SPA routing
  res.sendFile(path.join(__dirname, '../public/index.html'), (err) => {
    if (err) {
      next();
    }
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
