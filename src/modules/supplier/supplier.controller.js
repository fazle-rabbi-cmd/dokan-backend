const Supplier = require('./supplier.model');
const Inventory = require('../inventory/inventory.model');
const Log = require('../logs/log.model');

exports.addSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);

    await Log.create({
      module: 'Supplier',
      action: 'CREATE',
      targetId: supplier._id,
      newValue: supplier,
      performedBy: req.user.id
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSupplierDetails = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: "Not found" });

    const products = await Inventory.find({ supplier: supplier._id }).select('name sku quantity status');

    res.status(200).json({
      success: true,
      data: {
        supplier,
        products,
        totalProducts: products.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.query.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const hasInventory = await Inventory.findOne({ supplier: req.query.id, quantity: { $gt: 0 } });
    
    if (hasInventory) {
      return res.status(400).json({ 
        success: false, 
        message: "সাপ্লায়ারের স্টকে মাল আছে, তাই ইনঅ্যাক্টিভ করা সম্ভব নয়।" 
      });
    }

    await Supplier.findByIdAndUpdate(req.query.id, { status: 'Inactive' });
    res.status(200).json({ success: true, message: "Supplier deactivated" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};