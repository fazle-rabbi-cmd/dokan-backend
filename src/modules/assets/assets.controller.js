const Asset = require('./assets.model');
const Expense = require('../expense/expense.model');
const Log = require('../logs/log.model');

// ১. Notun Asset Add (With Auto-Expense Sync)
exports.addAsset = async (req, res) => {
  try {
    const asset = await Asset.create({
      ...req.body,
      currentValue: req.body.purchasePrice, // Shurute purchase price-i current value
      addedBy: req.user.id
    });

    // Asset keno mane cash outflow, tai Expense-e entry hobe
    await Expense.create({
      title: `Asset Purchase: ${asset.name}`,
      amount: asset.purchasePrice,
      category: 'Others', // Tumi chaitle 'Asset' category Expense-e add korte paro
      expenseDate: asset.purchaseDate,
      recordedBy: req.user.id,
      description: `New asset added to the system: ${asset.name}`
    });

    await Log.create({
      module: 'Accounts',
      action: 'CREATE',
      targetId: asset._id,
      itemName: asset.name,
      performedBy: req.user.id
    });

    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ২. All Assets list
exports.getAssets = async (req, res) => {
  try {
    const assets = await Asset.find({ status: { $ne: 'Disposed' } }).sort({ purchaseDate: -1 });
    res.status(200).json({ success: true, count: assets.length, data: assets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. Asset Valuation (Balance Sheet-er jonno critical)
exports.getAssetValuation = async (req, res) => {
  try {
    const valuation = await Asset.aggregate([
      { $match: { status: 'Active' } },
      { 
        $group: { 
          _id: null, 
          totalPurchasePrice: { $sum: "$purchasePrice" },
          totalCurrentValue: { $sum: "$currentValue" } 
        } 
      }
    ]);

    res.status(200).json({ 
      success: true, 
      data: valuation[0] || { totalPurchasePrice: 0, totalCurrentValue: 0 } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. Update Asset (Condition ba Value change kora)
exports.updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!asset) return res.status(404).json({ success: false, message: "Asset not found" });
    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ৫. Delete/Dispose Asset
exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, { status: 'Disposed' }, { new: true });
    res.status(200).json({ success: true, message: "Asset marked as Disposed" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};