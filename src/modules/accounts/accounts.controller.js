const Sales = require('../sales/sales.model');
const Expense = require('../expense/expense.model');
const Inventory = require('../inventory/inventory.model');
const mongoose = require('mongoose');

// ১. Balance Sheet: Business-e ekhon ki obostha (Assets vs Liabilities)
exports.getBalanceSheet = async (req, res) => {
  try {
    // Current Inventory Value (Asset)
    const inventoryAsset = await Inventory.aggregate([
      { $group: { _id: null, totalValue: { $sum: { $multiply: ["$quantity", "$buyingPrice"] } } } }
    ]);

    // Accounts Receivable (Customer theke koto pabo - Asset)
    const totalDueFromCustomers = await Sales.aggregate([
      { $group: { _id: null, totalDue: { $sum: "$dueAmount" } } }
    ]);

    // Total Sales Revenue (Cash in hand - simplified)
    const totalRevenue = await Sales.aggregate([
      { $group: { _id: null, totalPaid: { $sum: "$paidAmount" } } }
    ]);

    const assets = (inventoryAsset[0]?.totalValue || 0) + (totalDueFromCustomers[0]?.totalDue || 0) + (totalRevenue[0]?.totalPaid || 0);

    res.status(200).json({
      success: true,
      data: {
        inventoryValue: inventoryAsset[0]?.totalValue || 0,
        accountsReceivable: totalDueFromCustomers[0]?.totalDue || 0,
        cashInHand: totalRevenue[0]?.totalPaid || 0,
        totalAssets: assets
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. Cash Flow: Koto taka ashlo ar koto taka gelo (Monthly/Weekly)
exports.getCashFlow = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = startDate && endDate ? { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } } : {};

    const totalInflow = await Sales.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$paidAmount" } } }
    ]);

    const totalOutflow = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.status(200).json({
      success: true,
      inflow: totalInflow[0]?.total || 0,
      outflow: totalOutflow[0]?.total || 0,
      netCashFlow: (totalInflow[0]?.total || 0) - (totalOutflow[0]?.total || 0)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. Customer Ledger: Ekjon specific customer-er purono history
exports.getCustomerLedger = async (req, res) => {
  try {
    const customerId = req.params.id; // Athoba phone number use kora jay
    const history = await Sales.find({ customerPhone: customerId })
      .sort({ createdAt: -1 })
      .select('invoiceNumber totalAmount paidAmount dueAmount status createdAt');

    const summary = history.reduce((acc, sale) => {
      acc.totalBought += sale.totalAmount;
      acc.totalPaid += sale.paidAmount;
      acc.currentDue += sale.dueAmount;
      return acc;
    }, { totalBought: 0, totalPaid: 0, currentDue: 0 });

    res.status(200).json({ success: true, summary, transactions: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. Supplier Ledger: Koto takar mal kena hoyeche (Advanced)
exports.getSupplierLedger = async (req, res) => {
  try {
    const supplierId = req.params.id;
    const inventoryPurchases = await Inventory.find({ supplier: supplierId })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    const totalPurchasedValue = inventoryPurchases.reduce((acc, item) => acc + (item.quantity * item.buyingPrice), 0);

    res.status(200).json({
      success: true,
      totalPurchasedValue,
      items: inventoryPurchases
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};