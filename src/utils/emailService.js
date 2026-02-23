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

  // স্মার্ট চেক: যদি প্রথম প্যারামিটারটি একটি অবজেক্ট হয় (মান্থলি রিপোর্টের জন্য)
  if (typeof param1 === 'object' && param1 !== null) {
    mailOptions.to = param1.email;
    mailOptions.subject = param1.subject;
    mailOptions.text = param1.message;
    mailOptions.html = param1.isHtml ? param1.message : null;
  } 
  // নতুবা যদি আলাদা আলাদা প্যারামিটার হয় (লো স্টক অ্যালার্টের জন্য)
  else {
    const itemName = param1;
    const currentQty = param2;
    const supplierEmail = param3;

    mailOptions.to = supplierEmail;
    mailOptions.subject = `🚨 Low Stock Alert: ${itemName}`;
    mailOptions.text = `আমাদের ইনভেন্টরিতে ${itemName} এর স্টক কমে ${currentQty} টিতে নেমেছে। দয়া করে নতুন স্টক পাঠানোর ব্যবস্থা করুন।`;
  }

  await transporter.sendMail(mailOptions);
};

// দুই নামেই এক্সপোর্ট করছি যাতে আগের কোনো কোড এরর না দেয়
module.exports = sendEmail;
module.exports.sendLowStockEmail = sendEmail;