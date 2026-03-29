const Coupon = require('./marketing.model');
const Customer = require('../customer/customer.model');
const Log = require('../logs/log.model');

// ১. Bulk SMS Logic (Template structure)
exports.sendBulkSMS = async (req, res) => {
  try {
    const { message, targetGroup } = req.body; // targetGroup: 'All', 'Due-Holders', 'Top-Customers'
    
    let customers = [];
    if (targetGroup === 'All') customers = await Customer.find().select('phone');
    else if (targetGroup === 'Due-Holders') customers = await Customer.find({ totalDue: { $gt: 0 } }).select('phone');

    const phoneNumbers = customers.map(c => c.phone);

    // Ekhane tumi tomar SMS Gateway API (e.g., Twilio, SSLWireless) call korbe
    console.log(`Sending SMS to ${phoneNumbers.length} customers: ${message}`);

    await Log.create({
      module: 'User',
      action: 'UPDATE',
      itemName: `Bulk SMS sent to ${phoneNumbers.length} people`,
      performedBy: req.user.id
    });

    res.status(200).json({ success: true, message: `${phoneNumbers.length} জন কাস্টমারকে এসএমএস পাঠানো হয়েছে।` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. Coupon Management
exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getActiveCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({ 
      status: 'Active', 
      expiryDate: { $gt: new Date() } 
    });
    res.status(200).json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ৩. Loyalty Points Check
exports.getLoyaltyPoints = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId).select('name points totalSpent');
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};