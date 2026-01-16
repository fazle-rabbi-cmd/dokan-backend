const Inventory = require('./inventory.model');

exports.addItem = async (req, res) => {
  try {
    const newItem = await Inventory.create(req.body);
    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllItems = async (req, res) => {
  try {
    const items = await Inventory.find();
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};