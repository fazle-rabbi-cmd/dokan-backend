const express = require('express');
const router = express.Router();
const { addItem, getAllItems, updateItem, deleteItem, getInventoryStats } = require('./inventory.controller');
const { protect } = require('../../middleware/auth');

router.use(protect); 

router.get('/stats', getInventoryStats);
router.post('/addItem', addItem);
router.get('/getAllItems', getAllItems);
router.patch('/updateItem', updateItem);
router.delete('/deleteItem', deleteItem);
router.get('/getInventoryStats', getInventoryStats);

module.exports = router;