const Setting = require('./settings.model');
const Log = require('../logs/log.model');

// ১. Get Shop Profile
exports.getShopProfile = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    
    // Jodi database-e ekhno kisu na thake, ekta default entry show korbe
    if (!settings) {
      settings = { shopName: "Your Shop Name", currency: "BDT" };
    }
    
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ২. Update Shop Profile (Admin Only)
exports.updateShopProfile = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Logo upload handle (Middleware theke ashle)
    if (req.file) {
      updateData.logo = req.file.path; // Image path update
    }

    updateData.lastUpdatedBy = req.user.id;

    // findOneAndUpdate with upsert: true mane holo thakle update, na thakle create
    const settings = await Setting.findOneAndUpdate(
      {}, 
      updateData, 
      { new: true, upsert: true, runValidators: true }
    );

    // Audit Log update
    await Log.create({
      module: 'User',
      action: 'UPDATE',
      itemName: 'Shop Settings Updated',
      performedBy: req.user.id
    });

    res.status(200).json({ 
      success: true, 
      message: "Shop profile updated successfully", 
      data: settings 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};