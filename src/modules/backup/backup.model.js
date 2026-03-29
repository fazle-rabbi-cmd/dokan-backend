const mongoose = require('mongoose');

const BackupSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  filePath: { type: String, required: true },
  size: { type: String }, // e.g., "2.5 MB"
  format: { type: String, default: 'JSON' },
  status: { type: String, enum: ['Success', 'Failed'], default: 'Success' },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Backup', BackupSchema);