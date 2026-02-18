const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true },
  quantity: { type: Number, default: 0, min: 0 },
  minStockLevel: { type: Number, default: 5 },
  category: { type: String, required: true },
  warehouseLocation: { type: String, required: true }, 
  status: { 
    type: String, 
    enum: ['In Stock', 'Low Stock', 'Out of Stock'], 
    default: 'In Stock' 
  },
  image: { 
    type: String, 
    default: 'https://res.cloudinary.com/demo/image/upload/v1624531888/sample.jpg' 
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema);