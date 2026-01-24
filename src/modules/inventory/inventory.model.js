const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true },
  quantity: { type: Number, default: 0, min: 0 },
  minStockLevel: { type: Number, default: 5 }, // gives alert if less than or equal to 5
  category: { type: String, required: true },
  warehouseLocation: { 
    type: String, 
    required: true 
  }, 
  status: { 
    type: String, 
    enum: ['In Stock', 'Low Stock', 'Out of Stock'], 
    default: 'In Stock' 
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // the user who added the item
  }
}, { timestamps: true });

// logic to update status autocamatically before save data
InventorySchema.pre('validate', function() {
  if (!this.sku) {
    this.sku = (this.name.substring(0, 3).toUpperCase()) + '-' + Math.floor(1000 + Math.random() * 9000);
  }
  if (this.quantity <= 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity <= this.minStockLevel) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }

});

module.exports = mongoose.model('Inventory', InventorySchema);