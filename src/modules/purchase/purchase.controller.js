const Purchase = require('./purchase.model');
const Inventory = require('../inventory/inventory.model');
const Supplier = require('../supplier/supplier.model');
const Log = require('../logs/log.model');

// ১. Create Purchase Record
exports.createPurchase = async (req, res) => {
  try {
    const { supplier, items, paidAmount } = req.body;
    
    let totalAmount = 0;
    items.forEach(item => {
      item.total = item.quantity * item.buyingPrice;
      totalAmount += item.total;
    });

    const purchaseNumber = `PUR-${Date.now()}`;
    const dueAmount = totalAmount - (paidAmount || 0);
    const paymentStatus = dueAmount <= 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Due');

    const purchase = await Purchase.create({
      ...req.body,
      purchaseNumber,
      totalAmount,
      dueAmount,
      paymentStatus,
      addedBy: req.user.id
    });

    // Supplier Ledger Sync: Supplier-er baki (Payable) update kora
    await Supplier.findByIdAndUpdate(supplier, {
      $inc: { totalPurchased: totalAmount, balance: dueAmount }
    });

    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ২. Update Status & Stock-In Logic
exports.updatePurchaseStatus = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });

    if (purchase.status === 'Received') {
      return res.status(400).json({ success: false, message: "Stock already received!" });
    }

    const newStatus = req.body.status; // e.g., 'Received'

    if (newStatus === 'Received') {
      // Inventory-te mal add kora
      for (const item of purchase.items) {
        await Inventory.findByIdAndUpdate(item.productId, {
          $inc: { quantity: item.quantity },
          $set: { buyingPrice: item.buyingPrice, status: 'In Stock' }
        });
      }
    }

    purchase.status = newStatus;
    await purchase.save();

    await Log.create({
      module: 'Inventory',
      action: 'UPDATE',
      itemName: `Purchase Received: ${purchase.purchaseNumber}`,
      performedBy: req.user.id
    });

    res.status(200).json({ success: true, message: `Status updated to ${newStatus} and Stock Updated!` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().populate('supplier', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};