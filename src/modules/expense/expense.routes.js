const express = require('express');
const router = express.Router();
const { addExpense, getAllExpenses, getExpenseStats, deleteExpense } = require('./expense.controller');
const { protect, authorize } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

router.use(protect); 

router.post('/add', authorize('Admin'), upload.single('receiptImage'),addExpense); 
router.get('/all', getAllExpenses);
router.get('/stats', authorize('Admin'), getExpenseStats);
router.delete('/:id', authorize('Admin'), deleteExpense);

module.exports = router;