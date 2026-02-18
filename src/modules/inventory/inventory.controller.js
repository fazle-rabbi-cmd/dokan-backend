const Inventory = require('./inventory.model');
const Log = require('../logs/log.model');
const { Parser } = require('json2csv'); // এটি নিশ্চিত করো ইনস্টল আছে (npm install json2csv)
const sendLowStockEmail = require('../../utils/emailService');
const Supplier = require('../supplier/supplier.model');

exports.addItem = async (req, res) => {
  try {
    // Multer বডি প্রসেস করার পর ডাটা এখান থেকে নেবে
    const { name, quantity, category, warehouseLocation, minStockLevel, supplier } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Product name is required" });
    }

    // SKU এবং Status লজিক
    const prefix = name.substring(0, 3).toUpperCase();
    const sku = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qty = Number(quantity) || 0;
    const minLvl = Number(minStockLevel) || 5;

    let status = 'In Stock';
    if (qty <= 0) status = 'Out of Stock';
    else if (qty <= minLvl) status = 'Low Stock';

    const newItem = await Inventory.create({
      name,
      sku,
      quantity: qty,
      minStockLevel: minLvl,
      category,
      warehouseLocation,
      supplier,
      status,
      addedBy: req.user.id,
      image: req.file ? req.file.path : undefined // Cloudinary URL
    });

    // অ্যাক্টিভিটি লগ
    await Log.create({
      itemId: newItem._id,
      itemName: newItem.name,
      action: 'CREATE',
      changes: { after: { quantity: newItem.quantity, status: newItem.status } },
      performedBy: req.user.id
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.exportToCSV = async (req, res) => {
  try {
    const items = await Inventory.find().select('name sku quantity category status warehouseLocation');
    
    const fields = ['name', 'sku', 'quantity', 'category', 'status', 'warehouseLocation'];
    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(items);

    res.header('Content-Type', 'text/csv');
    res.attachment('inventory_report.csv');
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    if (!itemId) return res.status(400).json({ success: false, message: "ID is required" });

    // ১. আইটেমটি খুঁজে বের করো এবং তার সাথে যুক্ত সাপ্লায়ারের ডাটা পপুলেট করো
    let item = await Inventory.findById(itemId).populate('supplier');
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    const beforeUpdate = { quantity: item.quantity, status: item.status };

    // ২. নতুন ডাটা দিয়ে আপডেট করো
    Object.assign(item, req.body);

    // ৩. স্ট্যাটাস অটো-আপডেট
    if (item.quantity <= 0) {
      item.status = 'Out of Stock';
    } else if (item.quantity <= item.minStockLevel) {
      item.status = 'Low Stock';
    } else {
      item.status = 'In Stock';
    }

    await item.save(); 

    // ৪. স্মার্ট অটোমেশন: পপুলেট করা সাপ্লায়ারকে সরাসরি মেইল পাঠানো
    if (item.status === 'Low Stock' || item.status === 'Out of Stock') {
      
      // আমরা চেক করছি সাপ্লায়ার ডাটা আছে কি না এবং সে Active কি না
      if (item.supplier && item.supplier.status === 'Active') {
        sendLowStockEmail(item.name, item.quantity, item.supplier.email, item.supplier.name)
          .catch(err => console.log("Email error:", err.message));
      } else {
        console.log("⚠️ সাপ্লায়ার খুঁজে পাওয়া যায়নি অথবা সাপ্লায়ার ইনঅ্যাক্টিভ।");
      }
    }

    // ৫. UPDATE Log তৈরি করা
    await Log.create({
      itemId: item._id,
      itemName: item.name,
      action: 'UPDATE',
      changes: {
        before: beforeUpdate,
        after: { quantity: item.quantity, status: item.status }
      },
      performedBy: req.user.id
    });

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ৩. আইটেম ডিলিট + লগ
exports.deleteItem = async (req, res) => {
  try {
    const itemId = req.query.id; 
    if (!itemId) return res.status(400).json({ success: false, message: "ID is required" });

    const item = await Inventory.findByIdAndDelete(itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    // DELETE Log তৈরি করা
    await Log.create({
      itemName: item.name,
      action: 'DELETE',
      changes: { before: { quantity: item.quantity, status: item.status } },
      performedBy: req.user.id
    });

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

// ৪. আইটেম হিস্ট্রি দেখার জন্য নতুন ফাংশন
exports.getItemHistory = async (req, res) => {
  try {
    const query = req.query.id ? { itemId: req.query.id } : {};
    const logs = await Log.find(query)
      .populate('performedBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};