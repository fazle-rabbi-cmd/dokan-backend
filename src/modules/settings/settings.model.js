const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  shopName: { type: String, required: true, default: "My Business ERP" },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  logo: { type: String }, // Cloudinary ba Local Storage URL
  currency: { type: String, default: "BDT" },
  vatPercentage: { type: Number, default: 0 }, // Bill calculation-e lagbe
  invoiceFooter: { type: String, default: "Thank you for shopping with us!" },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Setting', SettingSchema);