const fs = require('fs');
const path = require('path');
const multer = require('multer');
const env = require('../config/env');

// Configure storage for resources
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // If RESOURCES_UPLOAD_DIR is absolute, use as-is; otherwise resolve from project root
    const base = path.resolve(__dirname, '..');
    const resolvedDir = path.isAbsolute(env.RESOURCES_UPLOAD_DIR)
      ? env.RESOURCES_UPLOAD_DIR
      : path.resolve(base, env.RESOURCES_UPLOAD_DIR);

    if (!fs.existsSync(resolvedDir)) {
      fs.mkdirSync(resolvedDir, { recursive: true });
    }

    cb(null, resolvedDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Allow common document and media types for resources
const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'audio/mpeg',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type.'));
  }
};

const resourceUpload = multer({ storage, fileFilter });

module.exports = resourceUpload;
