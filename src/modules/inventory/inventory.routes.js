const express = require('express');
const router = express.Router();
const { addItem, getAllItems, updateItem, deleteItem, getInventoryStats, getItemHistory, exportToCSV, getLowStockItems, adjustStock } = require('./inventory.controller');
const { protect, authorize } = require('../../middleware/auth');
const { validateInventory } = require('../../middleware/validator');
const upload = require('../../middleware/upload');

router.use(protect); 

router.get('/export', exportToCSV);
router.post('/addItem', upload.single('image'), validateInventory, addItem);
router.get('/getAllItems', getAllItems);
router.get('/low-stock', getLowStockItems);
router.patch('/updateItem', updateItem);
router.delete('/deleteItem', authorize('Admin'), deleteItem);
router.get('/getInventoryStats', getInventoryStats);
router.get('/getItemHistory', getItemHistory);
router.post('/adjust-stock', authorize('Admin'), adjustStock);


module.exports = router;