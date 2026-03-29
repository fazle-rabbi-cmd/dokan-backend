const express = require('express');
const router = express.Router();
const { addAsset, getAssets, updateAsset, deleteAsset, getAssetValuation } = require('./assets.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);
router.use(authorize('Admin')); // Assets shudhu Admin manage korbe

router.post('/add', addAsset); // Fridge ba Computer kinle entry
router.get('/all', getAssets);
router.get('/valuation', getAssetValuation); // Total asset value calculate kora
router.patch('/:id', updateAsset);
router.delete('/:id', deleteAsset);

module.exports = router;