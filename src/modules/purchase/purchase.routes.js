const express = require('express');
const router = express.Router();
const { createPurchase, getPurchases, getPurchaseById, updatePurchaseStatus } = require('./purchase.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

router.post('/create', authorize('Admin', 'Manager'), createPurchase); // Stock In kora
router.get('/all', getPurchases); 
router.get('/:id', getPurchaseById);
router.patch('/:id/status', authorize('Admin'), updatePurchaseStatus); // Received/Pending status

module.exports = router;