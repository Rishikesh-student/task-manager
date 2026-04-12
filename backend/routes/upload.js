const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'task-manager', allowed_formats: ['jpg', 'png', 'pdf', 'docx'] }
});

const upload = multer({ storage });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    res.json({
      url: req.file.path,
      publicId: req.file.filename,
      name: req.file.originalname
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;