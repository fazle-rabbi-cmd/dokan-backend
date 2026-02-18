const Supplier = require('./supplier.model');

exports.addSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.status(200).json({ success: true, data: suppliers });
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
    const supplier = await Supplier.findByIdAndUpdate(req.query.id, { status: 'Inactive' }, { new: true });
    if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found" });
    res.status(200).json({ success: true, message: "Supplier deactivated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};