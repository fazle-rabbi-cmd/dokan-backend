const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// সরাসরি কনফিগারেশন (স্ক্রিনশট ১৭০ অনুযায়ী)
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

// এই অংশটি নিশ্চিত করো
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 } // ৫ এমবি লিমিট
});

module.exports = upload;