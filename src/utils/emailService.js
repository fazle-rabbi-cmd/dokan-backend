const nodemailer = require('nodemailer');

const sendEmail = async (param1, param2, param3) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  let mailOptions = {
    from: `"Dokan ERP" <${process.env.EMAIL_USER}>`
  };

  if (typeof param1 === 'object' && param1 !== null) {
    mailOptions.to = param1.email;
    mailOptions.subject = param1.subject;
    mailOptions.text = param1.message;
    mailOptions.html = param1.isHtml ? param1.message : null;
  } 
 
  else {
    const itemName = param1;
    const currentQty = param2;
    const supplierEmail = param3;

    mailOptions.to = supplierEmail;
    mailOptions.subject = `🚨 Low Stock Alert: ${itemName}`;
    mailOptions.text = `আমাদের ইনভেন্টরিতে ${itemName} এর স্টক কমে ${currentQty} টিতে নেমেছে। দয়া করে নতুন স্টক পাঠানোর ব্যবস্থা করুন।`;
    mailOptions.html = `
      <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
        <h2 style="color: #e74c3c;">Low Stock Alert!</h2>
        <p>আইটেম: <strong>${itemName}</strong></p>
        <p>বর্তমান পরিমাণ: <span style="color: red; font-weight: bold;">${currentQty}</span></p>
        <p>দয়া করে দ্রুত স্টক রিফিল করার ব্যবস্থা করুন।</p>
      </div>
    `;
  }

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
// module.exports.sendLowStockEmail = sendEmail;