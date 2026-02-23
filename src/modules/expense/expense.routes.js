const express = require('express');
const router = express.Router();
const { addExpense, getAllExpenses } = require('./expense.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect); // সব রাউট প্রোটেক্টেড

router.post('/add', authorize('Admin'), addExpense); // শুধু অ্যাডমিন খরচ যোগ করবে
router.get('/all', getAllExpenses);

module.exports = router;