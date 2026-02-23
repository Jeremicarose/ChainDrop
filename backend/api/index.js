const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('../src/routes');
const { initializeDatabase } = require('../src/db/schema');

const app = express();

// Middleware
app.use(cors({
  origin: ['https://frontend-three-mu-81.vercel.app', 'http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initializeDatabase();

// API routes
app.use('/api', routes);

// Root
app.get('/', (req, res) => {
  res.json({ name: 'ChainDrop API', version: '1.0.0', status: 'running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.path });
});

module.exports = app;
