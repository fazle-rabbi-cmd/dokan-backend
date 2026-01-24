const express = require('express');
const router = express.Router();
const { addItem, getAllItems, updateItem, deleteItem, getInventoryStats } = require('./inventory.controller');
const { protect, authorize } = require('../../middleware/auth');
const { validateInventory } = require('../../middleware/validator');

router.use(protect); 

router.get('/stats', getInventoryStats);
router.post('/addItem', validateInventory, addItem);
router.get('/getAllItems', getAllItems);
router.patch('/updateItem', updateItem);
router.delete('/deleteItem', authorize('Admin'), deleteItem);
router.get('/getInventoryStats', getInventoryStats);

module.exports = router;