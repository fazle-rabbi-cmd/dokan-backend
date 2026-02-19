const express = require('express');
const router = express.Router();
const { createSale, downloadInvoice, getSales, getSalesStats, getAdvancedStats, updateDuePayment  } = require('./sales.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

router.post('/create', createSale);
router.get('/download', downloadInvoice);
router.get('/all', getSales); // সব সেলস দেখার জন্য
router.get('/stats', authorize('Admin'), getSalesStats); // শুধুমাত্র অ্যাডমিন ড্যাশবোর্ড স্ট্যাটস দেখবে
router.get('/advanced-stats', authorize('Admin'), getAdvancedStats);
router.patch('/update-due', updateDuePayment);

module.exports = router;