const express = require('express');
const router = express.Router();
const { addCustomer, getAllCustomers, getCustomerById, updateCustomer, getDueCustomers } = require('./customer.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

router.post('/add', addCustomer);
router.get('/all', getAllCustomers);
router.get('/dues', authorize('Admin'), getDueCustomers); // Kara baki rekheche tader list
router.get('/:id', getCustomerById);
router.patch('/:id', updateCustomer);

module.exports = router;