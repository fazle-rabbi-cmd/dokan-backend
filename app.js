const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const helmet = require('helmet');
const sanitize = require('mongo-sanitize'); // এটি আমরা ব্যবহার করছি
const rateLimit = require('express-rate-limit');

dotenv.config();

const inventoryRoutes = require('./src/modules/inventory/inventory.routes');
const supplierRoutes = require('./src/modules/supplier/supplier.routes');
const authRoutes = require('./src/modules/auth/auth.routes'); 

const app = express();

// --- ১. গ্লোবাল মিডলওয়্যার (Body Parser আগে থাকতে হবে) ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// --- ২. সিকিউরিটি মিডলওয়্যার (XSS Clean বাদ দেওয়া হয়েছে) ---
app.use(helmet()); // Security headers set করে

// Custom NoSQL Injection Protection
app.use((req, res, next) => {
    req.body = sanitize(req.body);
    req.query = sanitize(req.query);
    req.params = sanitize(req.params);
    next();
});

// কাস্টম XSS স্যানিটাইজার (xss-clean এর বদলে নিরাপদ বিকল্প)
app.use((req, res, next) => {
    const cleanHTML = (val) => {
        if (typeof val === 'string') {
            return val.replace(/[<>]/g, ''); // ট্যাগগুলো রিমুভ করবে
        }
        return val;
    };
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            req.body[key] = cleanHTML(req.body[key]);
        });
    }
    next();
});

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 100
});
app.use('/api/', limiter);

// --- ৩. এপিআই রাউটস ---
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', message: 'Storage System API is running' });
});

app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/supplier', supplierRoutes);
app.use('/api/v1/auth', authRoutes);

// --- ৪. এরর হ্যান্ডলিং ---
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Resource not found' });
});

app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

module.exports = app;