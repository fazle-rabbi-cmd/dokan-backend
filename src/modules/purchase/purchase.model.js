const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema({
  purchaseNumber: { type: String, required: true, unique: true }, // e.g., PUR-17109456
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    name: String,
    quantity: { type: Number, required: true },
    buyingPrice: { type: Number, required: true },
    total: Number
  }],
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Ordered', 'Received', 'Cancelled'], 
    default: 'Ordered' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['Paid', 'Partial', 'Due'], 
    default: 'Due' 
  },
  purchaseDate: { type: Date, default: Date.now },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', PurchaseSchema);