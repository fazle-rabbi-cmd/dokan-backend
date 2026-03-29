const Employee = require('./employee.model');
const { Salary } = require('./employee.model');
const Expense = require('../expense/expense.model'); // Integration with Expense
const Log = require('../logs/log.model');

// --- Employee Management ---

exports.addEmployee = async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// --- Payroll Management (Standard ERP Logic) ---

exports.paySalary = async (req, res) => {
  try {
    const { employeeId, amount, month, paymentMethod } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });

    // 1. Create Salary Record
    const salary = await Salary.create({
      employee: employeeId,
      amount,
      month,
      paymentMethod,
      paidBy: req.user.id
    });

    // 2. Automatically Add to Expense Module (Very Important)
    await Expense.create({
      title: `Salary Payment: ${employee.name} (${month})`,
      amount: amount,
      category: 'Salary',
      expenseDate: new Date(),
      recordedBy: req.user.id,
      description: `Salary for ${employee.name}, Designation: ${employee.designation}`
    });

    // 3. Audit Log
    await Log.create({
      module: 'User', // As per our Log model enum
      action: 'UPDATE',
      itemName: `Salary Paid: ${employee.name}`,
      performedBy: req.user.id,
      changes: { after: salary }
    });

    res.status(200).json({ success: true, message: "Salary paid and recorded in expenses", data: salary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalaryHistory = async (req, res) => {
  try {
    const history = await Salary.find({ employee: req.params.employeeId }).sort({ paymentDate: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};