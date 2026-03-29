const mongoose = require('mongoose');

// Coupon Schema
const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, enum: ['Percentage', 'Fixed'], default: 'Percentage' },
  discountValue: { type: Number, required: true },
  minPurchase: { type: Number, default: 0 }, // Koto takar upore kinle apply hobe
  maxDiscount: { type: Number }, // Percentage hole max koto taka chhar pabe
  expiryDate: { type: Date, required: true },
  usageLimit: { type: Number, default: 100 }, // Koybar use kora jabe
  usedCount: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Expired', 'Disabled'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', CouponSchema);

// SMS Log Schema (Optional tracking)
const SMSLogSchema = new mongoose.Schema({
  recipientCount: Number,
  message: String,
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'Sent' }
}, { timestamps: true });

module.exports.SMSLog = mongoose.model('SMSLog', SMSLogSchema);