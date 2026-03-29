const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true }, // Phone-ei main ID
  email: { type: String, trim: true },
  address: { type: String },
  totalSpent: { type: Number, default: 0 }, // Customer koto takar mal kinlo
  totalDue: { type: Number, default: 0 },   // Bortoman baki
  creditLimit: { type: Number, default: 10000 }, // Koto taka porjonto baki deya jabe
  status: { type: String, enum: ['Active', 'Blacklisted'], default: 'Active' },
  points: { type: Number, default: 0 } // Loyalty points for future discounts
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);