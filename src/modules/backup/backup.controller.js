const Backup = require('./backup.model');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Log = require('../logs/log.model');

exports.generateBackup = async (req, res) => {
  try {
    // ১. Backup directory check (jodi folder na thake banaye nibe)
    const backupFolder = path.join(__dirname, '../../../backups');
    if (!fs.existsSync(backupFolder)) fs.mkdirSync(backupFolder);

    const collections = await mongoose.connection.db.listCollections().toArray();
    const backupData = {};

    // ২. Shob collection theke data loop kore JSON-e neya
    for (let collection of collections) {
      const name = collection.name;
      backupData[name] = await mongoose.connection.db.collection(name).find().toArray();
    }

    // ৩. File name ar path finalize kora
    const fileName = `backup-${Date.now()}.json`;
    const filePath = path.join(backupFolder, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

    // ৪. Database-e record rakha
    const stats = fs.statSync(filePath);
    const fileSize = (stats.size / (1024 * 1024)).toFixed(2) + " MB";

    const backupRecord = await Backup.create({
      filename: fileName,
      filePath: `/backups/${fileName}`,
      size: fileSize,
      generatedBy: req.user.id
    });

    // ৫. Log audit
    await Log.create({
      module: 'User', // Module enum onujayi
      action: 'CREATE',
      itemName: `System Backup: ${fileName}`,
      performedBy: req.user.id
    });

    res.status(201).json({ 
      success: true, 
      message: "Backup generated successfully", 
      data: backupRecord 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBackupHistory = async (req, res) => {
  try {
    const history = await Backup.find()
      .populate('generatedBy', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};