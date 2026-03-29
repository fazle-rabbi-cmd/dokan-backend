const express = require('express');
const router = express.Router();
const { addCategory, getCategories, deleteCategory } = require('./inventory.controller'); 
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);

router.post('/category', authorize('Admin'), addCategory);
router.get('/category/all', getCategories);
router.delete('/category/:id', authorize('Admin'), deleteCategory);

module.exports = router;