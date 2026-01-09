const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const { initializeDatabase } = require('./db/schema');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ChainDrop API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      send: 'POST /api/transfer/send',
      claim: 'POST /api/transfer/claim',
      getTransfer: 'GET /api/transfer/:claimToken',
      estimate: 'POST /api/transfer/estimate',
      stats: 'GET /api/transfer/stats'
      
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting ChainDrop API Server...\n');
    
    // Initialize database
    initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log('\n✅ Server running successfully!');
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`🌍 Network: http://0.0.0.0:${PORT}`);
      console.log(`\n📚 API Documentation:`);
      console.log(`   Health Check: GET /api/health`);
      console.log(`   Send Transfer: POST /api/transfer/send`);
      console.log(`   Claim Funds: POST /api/transfer/claim`);
      console.log(`   Get Transfer: GET /api/transfer/:claimToken`);
      console.log(`   Estimate: POST /api/transfer/estimate`);
      console.log(`\n🎯 Ready to process transfers!\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();