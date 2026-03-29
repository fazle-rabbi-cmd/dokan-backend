const Customer = require('./customer.model');
const Sales = require('../sales/sales.model');

// ১. Notun Customer Add (Same phone thakle error dibe)
exports.addCustomer = async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ২. All Customers list with pagination
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ totalSpent: -1 });
    res.status(200).json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. Due Customers List (Kara baki rekheche)
exports.getDueCustomers = async (req, res) => {
  try {
    const dueCustomers = await Customer.find({ totalDue: { $gt: 0 } }).sort({ totalDue: -1 });
    res.status(200).json({ success: true, count: dueCustomers.length, data: dueCustomers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৪. Customer Details with Sales History
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    // Sales history-o eksathe pathiye deya bhalo
    const salesHistory = await Sales.find({ customerPhone: customer.phone }).sort({ createdAt: -1 }).limit(10);

    res.status(200).json({ success: true, data: { customer, salesHistory } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৫. Update Profile
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};