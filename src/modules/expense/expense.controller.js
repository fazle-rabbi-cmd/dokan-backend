const Expense = require('./expense.model');
const Log = require('../logs/log.model');

// ১. নতুন খরচ যোগ করা
exports.addExpense = async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      recordedBy: req.user.id
    });

    // অ্যাক্টিভিটি লগ জেনারেট করা
    await Log.create({
      action: 'CREATE',
      itemName: `Expense: ${expense.title}`,
      performedBy: req.user.id,
      changes: { after: expense }
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ২. নির্দিষ্ট সময়ের সব খরচ দেখা (যেমন: এই মাসের খরচ)
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate('recordedBy', 'name email')
      .sort({ expenseDate: -1 });

    const totalExpenseAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    res.status(200).json({ 
      success: true, 
      count: expenses.length, 
      totalExpenseAmount, 
      data: expenses 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};