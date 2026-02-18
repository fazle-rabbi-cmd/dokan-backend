const express = require('express');
const router = express.Router();
const { addSupplier, getSuppliers, updateSupplier, deleteSupplier } = require('./supplier.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

router.post('/add', authorize('Admin'), addSupplier);
router.get('/all', getSuppliers);
router.patch('/update', authorize('Admin'), updateSupplier); // ID আসবে query param এ
router.delete('/delete', authorize('Admin'), deleteSupplier); // ID আসবে query param এ

module.exports = router;