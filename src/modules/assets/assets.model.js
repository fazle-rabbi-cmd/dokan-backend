const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { 
    type: String, 
    enum: ['Electronics', 'Furniture', 'Vehicle', 'Machinery', 'Office Supplies', 'Others'], 
    default: 'Others' 
  },
  purchasePrice: { type: Number, required: true },
  currentValue: { type: Number }, // Depreciation-er por bortoman dam
  purchaseDate: { type: Date, default: Date.now },
  description: { type: String },
  condition: { 
    type: String, 
    enum: ['New', 'Good', 'Damaged', 'Repairing'], 
    default: 'New' 
  },
  status: { type: String, enum: ['Active', 'Sold', 'Disposed'], default: 'Active' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Asset', AssetSchema);