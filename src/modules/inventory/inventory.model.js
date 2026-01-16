const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  quantity: { type: Number, default: 0 },
  category: { type: String, required: true },
  warehouseLocation: { type: String, required: true }, // e.g., "Aisle 4, Shelf B"
  status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema);