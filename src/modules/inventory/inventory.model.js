const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true },
  quantity: { type: Number, default: 0, min: 0 },
  unit: { type: String, default: 'Pcs', enum: ['Pcs', 'Kg', 'Ltr', 'Box', 'Packet'] },
  buyingPrice: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  minStockLevel: { type: Number, default: 5 },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: [true, 'Please select a category'] 
  },
  warehouseLocation: { type: String, required: true }, 
  supplier: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Supplier',
  required: [true, 'Please select a supplier for this item']
},
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