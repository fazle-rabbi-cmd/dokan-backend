const Inventory = require('./inventory.model');

exports.addItem = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    let items;
    // Jodi array hoy tobe bulk insert hobe, na hole single
    if (Array.isArray(req.body)) {
      items = req.body.map(item => ({ ...item, addedBy: req.user.id }));
      const newItems = await Inventory.insertMany(items);
      return res.status(201).json({ success: true, count: newItems.length, data: newItems });
    } else {
      req.body.addedBy = req.user.id;
      const newItem = await Inventory.create(req.body);
      return res.status(201).json({ success: true, data: newItem });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllItems = async (req, res) => {
  try {
    // 1. Pagination Setup
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 2. Search & Filter Logic
    let queryObj = { ...req.query };
    const excludeFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludeFields.forEach(el => delete queryObj[el]);

    // Advanced search (Name ba SKU diye)
    if (req.query.search) {
      queryObj.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { sku: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // 3. Execute Query
    const items = await Inventory.find(queryObj)
      .populate('addedBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    // 4. Metadata (Total count jate front-end e pagination kora jay)
    const total = await Inventory.countDocuments(queryObj);

    res.status(200).json({ 
      success: true, 
      count: items.length,
      totalItems: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: items 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const itemId = req.query.id; 
    if (!itemId) {
      return res.status(400).json({ success: false, message: "ID is required in query params" });
    }

    let item = await Inventory.findById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    Object.assign(item, req.body);
    await item.save(); 

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const itemId = req.query.id; 

    if (!itemId) {
      return res.status(400).json({ success: false, message: "ID is required in query params" });
    }

    const item = await Inventory.findByIdAndDelete(itemId);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    res.status(200).json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getInventoryStats = async (req, res) => {
  try {
    const stats = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalStock: { $sum: "$quantity" },
          lowStockCount: {
            $sum: { $cond: [{ $eq: ["$status", "Low Stock"] }, 1, 0] }
          },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ["$status", "Out of Stock"] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || { totalItems: 0, totalStock: 0, lowStockCount: 0, outOfStockCount: 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};