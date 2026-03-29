const express = require('express');
const router = express.Router();
const { updateShopProfile, getShopProfile } = require('./settings.controller');
const { protect, authorize } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

router.use(protect);

router.get('/shop-info', getShopProfile);
router.patch('/update-shop', authorize('Admin'), upload.single('logo'), updateShopProfile);

module.exports = router;