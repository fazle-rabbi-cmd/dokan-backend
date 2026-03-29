const Sales = require('../sales/sales.model');
const Expense = require('../expense/expense.model');
const Inventory = require('../inventory/inventory.model');
const Supplier = require('../supplier/supplier.model');

// ১. Dashboard Summary: Ekbare shob critical numbers
exports.getDashboardSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // a. Today's Total Sales & Revenue
    const todaySales = await Sales.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 }, profit: { $sum: "$totalProfit" } } }
    ]);

    // b. Total Inventory Value (Asset)
    const inventoryValue = await Inventory.aggregate([
      { $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$buyingPrice"] } } } }
    ]);

    // c. Total Dues (Receivable from Customers)
    const totalDues = await Sales.aggregate([
      { $match: { status: { $in: ['Due', 'Partial'] } } },
      { $group: { _id: null, total: { $sum: "$dueAmount" } } }
    ]);

    // d. Total Expense (This Month)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyExpense = await Expense.aggregate([
      { $match: { expenseDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    // e. Supplier Count
    const totalSuppliers = await Supplier.countDocuments({ status: 'Active' });

    res.status(200).json({
      success: true,
      data: {
        todaySales: todaySales[0]?.total || 0,
        todayProfit: todaySales[0]?.profit || 0,
        todayOrders: todaySales[0]?.count || 0,
        totalStockValue: inventoryValue[0]?.total || 0,
        totalCustomerDues: totalDues[0]?.total || 0,
        monthlyExpense: monthlyExpense[0]?.total || 0,
        activeSuppliers: totalSuppliers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. Weekly Sales Chart: Frontend Chart-er (ApexCharts/Chart.js) format-e data
exports.getWeeklySalesChart = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const chartData = await Sales.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalSales: { $sum: "$totalAmount" },
          totalProfit: { $sum: "$totalProfit" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Frontend-e labels (Dates) ar series (Values) alada lagte pare
    const labels = chartData.map(item => item._id);
    const salesSeries = chartData.map(item => item.totalSales);
    const profitSeries = chartData.map(item => item.totalProfit);

    res.status(200).json({
      success: true,
      data: {
        labels,
        datasets: [
          { label: 'Sales', data: salesSeries },
          { label: 'Profit', data: profitSeries }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};