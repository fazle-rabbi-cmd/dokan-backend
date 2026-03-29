const Sales = require('./sales.model');
const Expense = require('../expense/expense.model');
const Log = require('../logs/log.model');
const Inventory = require('../inventory/inventory.model');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer');
const sendEmail = require('../../utils/emailService');
const Customer = require('../customer/customer.model');

exports.createSale = async (req, res) => {
  try {
    const { customerName, customerPhone, items, paymentMethod } = req.body;
    let totalAmount = 0;
    let totalBuyingCost = 0;

    for (let item of items) {
      const product = await Inventory.findById(item.productId);
      if (!product || product.quantity < item.quantity) {
        return res.status(400).json({ success: false, message: `${product ? product.name : 'Item'} এর যথেষ্ট স্টক নেই!` });
      }

      product.quantity -= item.quantity;
      
      if (product.quantity <= 0) product.status = 'Out of Stock';
      else if (product.quantity <= product.minStockLevel) product.status = 'Low Stock';
      
      await product.save();
      
      item.name = product.name;
      item.buyingPrice = product.buyingPrice;
      item.total = item.quantity * item.price;
      totalAmount += item.total;
      totalBuyingCost += (item.quantity * product.buyingPrice);
    }

    const invoiceNumber = `INV-${Date.now()}`;
    const totalProfit = totalAmount - totalBuyingCost;
    const paidAmount = req.body.paidAmount || totalAmount;
    const dueAmount = totalAmount - paidAmount;
    const status = dueAmount <= 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Due');

    const newSale = await Sales.create({
    customerName, customerPhone, items, totalAmount, paidAmount, dueAmount, status, totalProfit,
    paymentMethod, invoiceNumber, soldBy: req.user.id
    });

    await Customer.findOneAndUpdate(
      { phone: customerPhone },
      { 
        $inc: { 
          totalSpent: totalAmount, 
          totalDue: dueAmount, 
          points: Math.floor(totalAmount / 100) // Proti ১০০ takay ১ point
        },
        $set: { name: customerName } // Name update kora thakbe
      },
      { upsert: true, new: true }
    );

    await Log.create({
      module: 'Accounts',
      action: 'CASH_IN',
      targetId: newSale._id,
      newValue: { 
        amount: newSale.paidAmount, 
        type: 'Income',
        description: `Sale from Invoice: ${newSale.invoiceNumber}`
      },
      performedBy: req.user.id
    });

    res.status(201).json({ success: true, data: newSale });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateDuePayment = async (req, res) => {
  try {

    const amount = Number(req.body.amount); 
    
    if (isNaN(amount)) {
      return res.status(400).json({ success: false, message: "Amount should be a valid number" });
    }
    const salesId = req.query.id; 
    const sale = await Sales.findById(salesId);

    if (!sale) return res.status(404).json({ success: false, message: "Sale not found" });

    sale.paidAmount += amount;
    sale.dueAmount -= amount;
    sale.status = sale.dueAmount <= 0 ? 'Paid' : 'Partial';

    await sale.save();
    res.status(200).json({ success: true, message: "Payment Updated!", data: sale });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSales = async (req, res) => {
  try {
    const sales = await Sales.find()
      .populate('soldBy', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalesStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Sales.aggregate([
      { $match: { createdAt: { $gte: today } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          cashSales: {
            $sum: { $cond: [{ $eq: ["$paymentMethod", "Cash"] }, "$totalAmount", 0] }
          },
          onlineSales: {
            $sum: { $cond: [{ $ne: ["$paymentMethod", "Cash"] }, "$totalAmount", 0] }
          }
        }
      }
    ]);

    res.status(200).json({ success: true, data: stats[0] || { message: "No sales today yet" } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdvancedStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailySales = await Sales.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const topProducts = await Sales.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.name" },
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.total" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        dailySales,
        topProducts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const invoiceId = req.query.id; 
    const sale = await Sales.findById( invoiceId ).populate('items.productId');
    
    if (!sale) {
      return res.status(404).json({ success: false, message: "Invoice not found!" });
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = `Invoice_${sale.invoiceNumber}.pdf`;

    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);
    
    doc.fillColor('#444444').fontSize(20).text('DOKAN ERP SYSTEM', 50, 50);
    doc.fontSize(10).text(`Invoice: ${sale.invoiceNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(12).text(`Bill To:`, { underline: true });
    doc.text(`Name: ${sale.customerName}`);
    doc.text(`Phone: ${sale.customerPhone || 'N/A'}`);
    doc.moveDown();

    const tableTop = 200;
    doc.fontSize(10).text('Item Description', 50, tableTop);
    doc.text('Qty', 250, tableTop);
    doc.text('Price', 350, tableTop);
    doc.text('Total', 450, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let i = 0;
    sale.items.forEach(item => {
      const y = tableTop + 30 + (i * 25);
      doc.text(item.name, 50, y);
      doc.text(item.quantity.toString(), 250, y);
      doc.text(item.price.toLocaleString(), 350, y);
      doc.text(item.total.toLocaleString(), 450, y);
      i++;
    });

    const footerTop = tableTop + 50 + (i * 25);
    doc.moveTo(50, footerTop).lineTo(550, footerTop).stroke();
    doc.fontSize(12).text(`Grand Total: BDT ${sale.totalAmount.toLocaleString()}`, 400, footerTop + 20, { bold: true });

    doc.fontSize(10).text('Thank you for shopping with us!', 50, 700, { align: 'center', width: 500 });

    doc.end();

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfitLossReport = async (req, res) => {
  try {

    const salesStats = await Sales.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" }, 
          totalItemsSold: { $sum: { $size: "$items" } },
          totalSalesCount: { $sum: 1 }
        }
      }
    ]);

    const totalExpenses = await Expense.aggregate([
      {
        $group: {
          _id: null,
          amount: { $sum: "$amount" }
        }
      }
    ]);

    const revenue = salesStats.length > 0 ? salesStats[0].totalRevenue : 0;
    const expense = totalExpenses.length > 0 ? totalExpenses[0].amount : 0;
    
    const netProfit = revenue - expense; 

    res.status(200).json({
      success: true,
      report: {
        totalRevenue: revenue,
        totalExpense: expense,
        estimatedNetProfit: netProfit,
        totalOrders: salesStats.length > 0 ? salesStats[0].totalSalesCount : 0,
        status: netProfit > 0 ? "In Profit" : "In Loss"
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductProfitAnalysis = async (req, res) => {
  try {
    const report = await Sales.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: "$items.name" },
          totalQtySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.total" },

          estimatedProfit: { 
            $sum: { $subtract: ["$items.total", { $multiply: ["$items.quantity", "$items.buyingPrice"] }] } 
          } 
        }
      },
      { $sort: { estimatedProfit: -1 } }
    ]);

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTopCustomers = async (req, res) => {
  try {
    const topCustomers = await Sales.aggregate([
      {
        $group: {
          _id: "$customerPhone",
          name: { $first: "$customerName" },
          totalSpent: { $sum: "$totalAmount" },
          visitCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({ success: true, data: topCustomers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendMonthlyReport = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [monthlySales, monthlyExpenses] = await Promise.all([
      Sales.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
      ]),
      Expense.aggregate([
        { $match: { expenseDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const sales = monthlySales[0]?.total || 0;
    const expenses = monthlyExpenses[0]?.total || 0;
    const netProfit = sales - expenses;

    const recipientEmail = req.user?.email || process.env.EMAIL_USER;
    const userName = req.user?.name || "Admin";

    if (!recipientEmail) {
      return res.status(400).json({ 
        success: false, 
        message: "রিসিভার ইমেইল পাওয়া যায়নি। দয়া করে লগইন করুন অথবা .env ফাইলে EMAIL_USER চেক করুন।" 
      });
    }

    const emailOptions = {
      email: recipientEmail,
      subject: `📊 Business Summary - ${new Date().toLocaleString('default', { month: 'long' })}`,
      message: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; border: 1px solid #eee; border-radius: 10px; max-width: 600px;">
          <h2 style="color: #2e7d32; border-bottom: 2px solid #2e7d32; padding-bottom: 10px;">Dokan ERP Monthly Report</h2>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Here is your business summary for this month so far:</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">Total Sales:</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;"><b>${sales.toLocaleString()} TK</b></td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">Total Expenses:</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; color: #d32f2f;"><b>${expenses.toLocaleString()} TK</b></td>
              </tr>
              <tr>
                <td style="padding: 10px; font-size: 18px;"><strong>Net Profit:</strong></td>
                <td style="padding: 10px; font-size: 18px; text-align: right; color: ${netProfit >= 0 ? '#2e7d32' : '#d32f2f'};">
                  <strong>${netProfit.toLocaleString()} TK</strong>
                </td>
              </tr>
            </table>
          </div>
          <p style="text-align: center; color: #666; font-size: 12px;">Generated by Dokan ERP Intelligence System</p>
        </div>
      `,
      isHtml: true 
    };

    await sendEmail(emailOptions);

    res.status(200).json({ 
      success: true, 
      message: `Report successfully sent to ${recipientEmail}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.returnSale = async (req, res) => {
  try {
    const saleId = req.query.id; 
    if (!saleId) return res.status(400).json({ success: false, message: "ID parameter is missing" });

    const sale = await Sales.findById(saleId);
    if (!sale) return res.status(404).json({ success: false, message: "Sale not found" });
    
    if (sale.status === 'Returned') {
      return res.status(400).json({ success: false, message: "This sale is already returned" });
    }

    // ১. Inventory stock firiye ana
    for (const item of sale.items) {
      const product = await Inventory.findById(item.productId);
      if (product) {
        product.quantity += item.quantity;
        if (product.quantity > product.minStockLevel) {
          product.status = 'In Stock';
        } else if (product.quantity > 0) {
          product.status = 'Low Stock';
        }
        await product.save();
      }
    }

    // ২. [CRITICAL UPDATE] Customer Ledger Adjustment
    // Mal return mane spent kombe, points kombe, ar due thakle oitao minus hobe
    await Customer.findOneAndUpdate(
      { phone: sale.customerPhone },
      { 
        $inc: { 
          totalSpent: -sale.totalAmount, // Negative increment mane minus kora
          totalDue: -sale.dueAmount,      // Baki o minus hoye jabe
          points: -Math.floor(sale.totalAmount / 100) 
        }
      }
    );

    // ৩. Sales status ar Profit adjustment
    const oldProfit = sale.totalProfit;
    sale.status = 'Returned';
    sale.totalProfit = 0; 
    await sale.save();

    // ৪. Log create kora (Audit tracking)
    await Log.create({
      module: 'Sales',
      action: 'RETURN',
      targetId: sale._id,
      changes: { 
        reason: req.body.reason || 'Customer Return',
        deductedProfit: oldProfit,
        adjustedCustomer: sale.customerPhone
      },
      performedBy: req.user.id
    });

    res.status(200).json({ success: true, message: "Sale returned, Stock, Profit & Customer Balance updated!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCustomerHistory = async (req, res) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({ success: false, message: "কাস্টমার ফোন নাম্বার প্রয়োজন।" });
    }

    const salesHistory = await Sales.find({ customerPhone: phone })
      .sort({ createdAt: -1 }) 
      .populate('items.productId', 'name category');

    if (salesHistory.length === 0) {
      return res.status(404).json({ success: false, message: "এই কাস্টমারের কোনো কেনাকাটার রেকর্ড পাওয়া যায়নি।" });
    }

    const summary = salesHistory.reduce((acc, sale) => {
      acc.totalSpent += sale.totalAmount;
      acc.totalDue += (sale.dueAmount || 0); 
      return acc;
    }, { totalSpent: 0, totalDue: 0 });

    res.status(200).json({
      success: true,
      count: salesHistory.length,
      customerSummary: {
        customerName: salesHistory[0].customerName, 
        customerPhone: phone,
        totalPurchases: salesHistory.length,
        totalSpent: summary.totalSpent,
        totalDue: summary.totalDue
      },
      data: salesHistory
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};