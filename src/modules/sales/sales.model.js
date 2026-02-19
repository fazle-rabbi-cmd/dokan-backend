const mongoose = require('mongoose');

const SalesSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    name: { type: String },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }, // প্রতিটির দাম
    total: { type: Number } // quantity * price
  }],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'Mobile Banking'], default: 'Cash' },
  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  invoiceNumber: { type: String, unique: true },
  
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Paid', 'Partial', 'Due'], default: 'Paid' }
}, { timestamps: true });

module.exports = mongoose.model('Sales', SalesSchema);