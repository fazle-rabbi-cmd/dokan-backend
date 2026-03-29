const Expense = require('./expense.model');
const Log = require('../logs/log.model');

exports.addExpense = async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      recordedBy: req.user.id,
      receiptImage: req.file ? req.file.path : undefined
    });

    await Log.create({
          module: 'Expense',
          action: 'CREATE',
          targetId: expense._id,
          newValue: expense,
          performedBy: req.user.id
        });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllExpenses = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.expenseDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (category) query.category = category;

    const expenses = await Expense.find(query)
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

exports.getExpenseStats = async (req, res) => {
  try {
    const stats = await Expense.aggregate([
      {
        $group: {
          _id: "$category", 
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Record not found"
      });
    }

    await Expense.findByIdAndDelete(expenseId);

    await Log.create({
          module: 'Expense',
          action: 'DELETE',
          targetId: expense._id,
          oldValue: expense,
          performedBy: req.user.id
        });

    res.status(200).json({
      success: true,
      message: "Successfully deleted"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};