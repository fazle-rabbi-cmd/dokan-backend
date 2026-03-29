const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: 'dof5bc6oc',
  api_key: '722973273511318',
  api_secret: '00iEdegMtVtUpDI5yI5ttOj_N5s'
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'inventory_items',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 } 
});

module.exports = upload;