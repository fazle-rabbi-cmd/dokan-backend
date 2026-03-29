const express = require('express');
const router = express.Router();
const { generateBackup, getBackupHistory } = require('./backup.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);
router.use(authorize('Admin'));

router.post('/generate', generateBackup); // Manual SQL/JSON backup trigger
router.get('/history', getBackupHistory);

module.exports = router;