const path = require('path');

// Simple controller to acknowledge uploaded image and return filename + public URL
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const filename = req.file.filename;
    // Public path where images are served
    const url = `/uploads/images/${filename}`;
    return res.json({ filename, url });
  } catch (e) {
    console.error('uploadImage error:', e);
    return res.status(500).json({ message: 'Failed to upload image' });
  }
};
