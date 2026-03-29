const express = require('express');
const router = express.Router();
const { 
    createSalesReturn, 
    createPurchaseReturn, 
    addDamageItem, 
    getAllReturns,
    getDamageStats 
} = require('./return.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

// Sales Return: Customer mal ferot dile (Stock barbe)
router.post('/sales-return', createSalesReturn); 

// Purchase Return: Supplier-ke mal ferot dile (Stock kombe)
router.post('/purchase-return', authorize('Admin'), createPurchaseReturn);

// Damage: Mal noshto hole (Stock kombe)
router.post('/damage/add', authorize('Admin', 'Manager'), addDamageItem);

router.get('/all', getAllReturns);
router.get('/damage-stats', authorize('Admin'), getDamageStats);

module.exports = router;