const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    cb(null, uploadPath); // Specify the uploads directory
  },
  filename: (req, file, cb) => {
    // Rename the file with a timestamp to avoid conflicts
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF files are allowed.'));
  }
};

// Maximum file size: 5MB
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /api/uploads/avatar - Upload an avatar
router.post('/avatar', authenticateUser, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please provide a valid file.',
      });
    }

    // File path relative to the server
    const filePath = `/uploads/${req.file.filename}`;

    // Optionally update the user's avatar in the database
    req.user.avatar = filePath;
    req.user.save();

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully.',
      filePath,
    });
  } catch (error) {
    console.error('Error uploading avatar:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error. Could not upload the avatar.',
    });
  }
});

module.exports = router;
