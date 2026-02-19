const Sales = require('./sales.model');
const Log = require('../logs/log.model');
const Inventory = require('../inventory/inventory.model');
const PDFDocument = require('pdfkit');
const fs = require('fs');

exports.createSale = async (req, res) => {
  try {
    const { customerName, customerPhone, items, paymentMethod } = req.body;
    let totalAmount = 0;

    // ১. প্রত্যেকটি আইটেম চেক করা এবং স্টক কমানো
    for (let item of items) {
      const product = await Inventory.findById(item.productId);
      if (!product || product.quantity < item.quantity) {
        return res.status(400).json({ success: false, message: `${product ? product.name : 'Item'} এর যথেষ্ট স্টক নেই!` });
      }

      // স্টক কমানো
      product.quantity -= item.quantity;
      
      // স্ট্যাটাস আপডেট (ইন্ডাস্ট্রি লজিক)
      if (product.quantity <= 0) product.status = 'Out of Stock';
      else if (product.quantity <= product.minStockLevel) product.status = 'Low Stock';
      
      await product.save();
      
      item.name = product.name; // ইনভয়েসের জন্য নাম রাখা
      item.total = item.quantity * item.price;
      totalAmount += item.total;
    }

    // ২. সেলস রেকর্ড তৈরি
    const invoiceNumber = `INV-${Date.now()}`;

    const paidAmount = req.body.paidAmount || totalAmount;
    const dueAmount = totalAmount - paidAmount;
    const status = dueAmount <= 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Due');

    const newSale = await Sales.create({
    customerName, customerPhone, items, totalAmount, paidAmount, dueAmount, status,
    paymentMethod, invoiceNumber, soldBy: req.user.id
    });

    await Log.create({
      action: 'CREATE', // যেহেতু নতুন সেল তৈরি হচ্ছে
      itemName: `Invoice: ${newSale.invoiceNumber}`, // কি জিনিস নিয়ে কাজ হলো
      performedBy: req.user.id, // কে করলো
      changes: {
        after: { 
          totalAmount: newSale.totalAmount, 
          customer: newSale.customerName,
          payment: newSale.paymentMethod
        }
      }
    });

    res.status(201).json({ success: true, data: newSale });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateDuePayment = async (req, res) => {
  try {

    // Number() দিয়ে নিশ্চিত করো এটা সংখ্যা
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

// ১. সব সেলস দেখা (Pagination সহ)
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

// ২. আজকের সেলস সামারি (Dashboard Logic)
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

    // ১. গত ৭ দিনের ডেইলি সেলস রিপোর্ট
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

    // ২. সবচেয়ে বেশি বিক্রি হওয়া ৫টি প্রোডাক্ট (Top Selling)
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

    // রেসপন্স হেডার সেট করা যাতে ব্রাউজার বুঝতে পারে এটা একটা PDF
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // --- PDF ডিজাইন শুরু ---
    
    // Header
    doc.fillColor('#444444').fontSize(20).text('DOKAN ERP SYSTEM', 50, 50);
    doc.fontSize(10).text(`Invoice: ${sale.invoiceNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // কাস্টমার ডিটেইলস
    doc.fontSize(12).text(`Bill To:`, { underline: true });
    doc.text(`Name: ${sale.customerName}`);
    doc.text(`Phone: ${sale.customerPhone || 'N/A'}`);
    doc.moveDown();

    // টেবিল হেডার
    const tableTop = 200;
    doc.fontSize(10).text('Item Description', 50, tableTop);
    doc.text('Qty', 250, tableTop);
    doc.text('Price', 350, tableTop);
    doc.text('Total', 450, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // টেবিল ডাটা (লুপ)
    let i = 0;
    sale.items.forEach(item => {
      const y = tableTop + 30 + (i * 25);
      doc.text(item.name, 50, y);
      doc.text(item.quantity.toString(), 250, y);
      doc.text(item.price.toLocaleString(), 350, y);
      doc.text(item.total.toLocaleString(), 450, y);
      i++;
    });

    // মোট হিসাব
    const footerTop = tableTop + 50 + (i * 25);
    doc.moveTo(50, footerTop).lineTo(550, footerTop).stroke();
    doc.fontSize(12).text(`Grand Total: BDT ${sale.totalAmount.toLocaleString()}`, 400, footerTop + 20, { bold: true });

    // ফুটার
    doc.fontSize(10).text('Thank you for shopping with us!', 50, 700, { align: 'center', width: 500 });

    doc.end();

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};