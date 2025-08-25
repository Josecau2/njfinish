const fs = require('fs');
const path = require('path');
const multer = require('multer');
const env = require('../config/env');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const base = path.resolve(__dirname, '..');
        const uploadRoot = path.resolve(base, env.UPLOAD_PATH);
        
        let uploadDir;
        if (['logoImage', 'manufacturerImage', 'styleImage', 'logo'].includes(file.fieldname)) {
            uploadDir = path.join(uploadRoot, 'images');
        } else if (file.fieldname === 'catalogFiles') {
            uploadDir = path.join(uploadRoot, 'manufacturer_catalogs');
        } else {
            uploadDir = uploadRoot; // fallback
        }

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const catalogTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
    ];
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (
        ['manufacturerImage', 'styleImage', 'logoImage','logo'].includes(file.fieldname) &&
        imageTypes.includes(file.mimetype)
    ) {
        cb(null, true);
    } else if (
        file.fieldname === 'catalogFiles' && catalogTypes.includes(file.mimetype)
    ) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type.'));
    }
};


// Export configured multer instance with file size limits
const upload = multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for catalog files
        files: 12 // Max 12 files total
    }
});

// Separate configuration for image uploads only (smaller size limit)
const imageUpload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        
        if (['manufacturerImage', 'styleImage', 'logoImage', 'logo'].includes(file.fieldname) &&
            imageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid image file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for images
        files: 1 // Only one image at a time
    }
});

module.exports = upload;
module.exports.imageUpload = imageUpload;
