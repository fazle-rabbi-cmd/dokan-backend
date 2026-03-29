const express = require('express');
const router = express.Router();
const { getDashboardSummary, getWeeklySalesChart } = require('./dashboard.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);
router.use(authorize('Admin')); // Dashboard stats shudhu Admin dekhbe

router.get('/summary', getDashboardSummary); // Total Sales, Total Stock Value, Today's Profit
router.get('/charts', getWeeklySalesChart); // Last 7 days sales data for graph

module.exports = router;