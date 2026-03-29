const express = require('express');
const router = express.Router();
const { addSupplier, getSuppliers, updateSupplier, deleteSupplier } = require('./supplier.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

router.post('/add', authorize('Admin'), addSupplier);
router.get('/all', getSuppliers);
router.get('/details/:id',authorize('Admin'), getSupplierDetails);
router.patch('/update', authorize('Admin'), updateSupplier); 
router.delete('/delete', authorize('Admin'), deleteSupplier); 

module.exports = router;