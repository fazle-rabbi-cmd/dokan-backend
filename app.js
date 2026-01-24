const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
// Load environment variables
dotenv.config();

// Import Routes (Modules)
const inventoryRoutes = require('./src/modules/inventory/inventory.routes');
const authRoutes = require('./src/modules/auth/auth.routes'); 

const app = express();

// 1. Global Middleware
// Morgan logs incoming requests to the console (useful for development)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Enable CORS for frontend communication
app.use(cors());

// Body parser (Allowing JSON and URL-encoded data)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



// 2. API Routes
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Storage System API is running' });
});

// Mount Module Routes
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/auth', authRoutes);



// 3. Error Handling
// Catch 404 and forward to error handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Resource not found'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

module.exports = app;