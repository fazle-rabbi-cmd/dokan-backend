const express = require('express');
const router = express.Router();
const { getBalanceSheet, getCashFlow, getCustomerLedger, getSupplierLedger } = require('./accounts.controller');
const { protect, authorize } = require('../../middleware/auth');

router.use(protect);
router.use(authorize('Admin')); // Financial data shudhu Admin dekhbe

router.get('/balance-sheet', getBalanceSheet); // Assets vs Liabilities
router.get('/cash-flow', getCashFlow); // Inflow vs Outflow
router.get('/ledger/customer/:id', getCustomerLedger); // Ekjon customer-er purono transactions
router.get('/ledger/supplier/:id', getSupplierLedger); // Supplier-er shathe transaction history

module.exports = router;