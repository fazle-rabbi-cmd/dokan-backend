const mongoose = require('mongoose');

const ReturnSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['Sales', 'Purchase', 'Damage'], 
    required: true 
  },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  quantity: { type: Number, required: true },
  reason: { type: String },
  amountAdjusted: { type: Number, default: 0 }, // Refund ba deduction amount
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // Sales ba Purchase ID
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Return', ReturnSchema);