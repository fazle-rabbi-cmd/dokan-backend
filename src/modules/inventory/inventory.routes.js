const express = require('express');
const router = express.Router();
const { addItem, getAllItems } = require('./inventory.controller');
const { protect } = require('../../middleware/auth');

router.route('/')
  .post(protect, addItem)
  .get(protect, getAllItems);

module.exports = router;