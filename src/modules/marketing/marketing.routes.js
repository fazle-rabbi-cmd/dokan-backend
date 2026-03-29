const express = require('express');
const router = express.Router();
const { sendBulkSMS, createCoupon, getActiveCoupons, getLoyaltyPoints } = require('./marketing.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

router.post('/send-sms', authorize('Admin'), sendBulkSMS); // Offer pathanor jonno
router.post('/coupons', authorize('Admin'), createCoupon); // Discount coupon create
router.get('/coupons/active', getActiveCoupons);
router.get('/loyalty/:customerId', getLoyaltyPoints); // Customer-er points check

module.exports = router;