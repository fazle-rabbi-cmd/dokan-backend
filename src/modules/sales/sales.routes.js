const express = require('express');
const router = express.Router();
const { createSale, downloadInvoice, getSales, getSalesStats, getAdvancedStats, updateDuePayment, getProfitLossReport, getTopCustomers, getProductProfitAnalysis, sendMonthlyReport, returnSale, getCustomerHistory  } = require('./sales.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

router.post('/create', createSale);
router.get('/download', downloadInvoice);
router.get('/all', getSales); 
router.get('/stats', authorize('Admin'), getSalesStats); 
router.get('/advanced-stats', authorize('Admin'), getAdvancedStats);
router.patch('/update-due', updateDuePayment);
router.get('/profit-loss', authorize('Admin'), getProfitLossReport);
router.get('/product-profit', authorize('Admin'), getProductProfitAnalysis);
router.get('/top-customers', authorize('Admin'), getTopCustomers);
router.get('/send-report', authorize('Admin'), sendMonthlyReport);
router.post('/return', authorize('Admin'), returnSale); 
router.get('/customer/:phone', getCustomerHistory);

module.exports = router;