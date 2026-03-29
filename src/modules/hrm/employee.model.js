const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  designation: { type: String, required: true }, // e.g., Manager, Salesman
  baseSalary: { type: Number, required: true },
  joiningDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
  address: String,
  nidNumber: String
}, { timestamps: true });

module.exports = mongoose.model('Employee', EmployeeSchema);

// Salary Model (To track payments)
const SalarySchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  amount: { type: Number, required: true },
  month: { type: String, required: true }, // e.g., "March 2026"
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'Mobile Banking'], default: 'Cash' },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Salary = mongoose.model('Salary', SalarySchema);
module.exports.Salary = Salary;