const nodemailer = require('nodemailer');

const sendLowStockEmail = async (itemName, currentQty, supplierEmail) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // তোমার জিমেইল
      pass: process.env.EMAIL_PASS  // জিমেইল অ্যাপ পাসওয়ার্ড
    }
  });

  const mailOptions = {
    from: '"Dokan Inventory" <noreply@dokan.com>',
    to: supplierEmail,
    subject: `🚨 Low Stock Alert: ${itemName}`,
    text: `আমাদের ইনভেন্টরিতে ${itemName} এর স্টক কমে ${currentQty} টিতে নেমেছে। দয়া করে নতুন স্টক পাঠানোর ব্যবস্থা করুন।`
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendLowStockEmail;