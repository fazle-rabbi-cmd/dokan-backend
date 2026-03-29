const Return = require('./return.model');
const Inventory = require('../inventory/inventory.model');
const Customer = require('../customer/customer.model');
const Supplier = require('../supplier/supplier.model');
const Log = require('../logs/log.model');

// ১. Sales Return: Customer mal ferot dile (Stock Barbe)
exports.createSalesReturn = async (req, res) => {
  try {
    const { productId, quantity, customerPhone, amountToRefund } = req.body;

    // Stock increase
    await Inventory.findByIdAndUpdate(productId, { 
      $inc: { quantity: quantity },
      $set: { status: 'In Stock' }
    });

    // Customer balance update (Spent kombe, points kombe)
    if (customerPhone) {
      await Customer.findOneAndUpdate(
        { phone: customerPhone },
        { $inc: { totalSpent: -amountToRefund, points: -Math.floor(amountToRefund / 100) } }
      );
    }

    const salesReturn = await Return.create({ ...req.body, type: 'Sales', performedBy: req.user.id });
    res.status(201).json({ success: true, data: salesReturn });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ২. Purchase Return: Supplier-ke mal ferot (Stock Kombe)
exports.createPurchaseReturn = async (req, res) => {
  try {
    const { productId, quantity, supplierId, amountToDeduct } = req.body;

    const product = await Inventory.findById(productId);
    if (product.quantity < quantity) return res.status(400).json({ message: "Stock-e eto mal nai!" });

    // Stock decrease
    await Inventory.findByIdAndUpdate(productId, { $inc: { quantity: -quantity } });

    // Supplier balance adjust (Amra koto pabo ba baki kombe)
    await Supplier.findByIdAndUpdate(supplierId, { $inc: { balance: -amountToDeduct } });

    const purchaseReturn = await Return.create({ ...req.body, type: 'Purchase', performedBy: req.user.id });
    res.status(201).json({ success: true, data: purchaseReturn });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ৩. Damage: Mal noshto hole (Stock Kombe & Loss)
exports.addDamageItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Inventory.findById(productId);
    if (product.quantity < quantity) return res.status(400).json({ message: "Stock-e eto mal nai!" });

    await Inventory.findByIdAndUpdate(productId, { $inc: { quantity: -quantity } });

    const damage = await Return.create({ ...req.body, type: 'Damage', performedBy: req.user.id });

    // Audit Log for Admin
    await Log.create({
      module: 'Inventory',
      action: 'UPDATE',
      itemName: `Damage Recorded: ${product.name} (${quantity} units)`,
      performedBy: req.user.id
    });

    res.status(201).json({ success: true, data: damage });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ৪. All Returns History
exports.getAllReturns = async (req, res) => {
  try {
    const returns = await Return.find().populate('productId', 'name sku').populate('performedBy', 'name');
    res.status(200).json({ success: true, data: returns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৫. Damage Stats (Total loss analysis)
exports.getDamageStats = async (req, res) => {
  try {
    const stats = await Return.aggregate([
      { $match: { type: 'Damage' } },
      { $group: { _id: null, totalDamagedItems: { $sum: "$quantity" } } }
    ]);
    res.status(200).json({ success: true, data: stats[0] || { totalDamagedItems: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};