const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const { initializeDatabase } = require('./db/schema');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware