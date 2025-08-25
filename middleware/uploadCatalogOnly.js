const fs = require('fs');
const path = require('path');
const multer = require('multer');
const env = require('../config/env');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const base = path.resolve(__dirname, '..');
        const uploadRoot = path.resolve(base, env.UPLOAD_PATH);
        const uploadDir = path.join(uploadRoot, 'manufacturer_catalogs');
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
        file.fieldname === 'catalogFiles' && catalogTypes.includes(file.mimetype)
    ) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type.'));
    }
};

// Export configured multer instance (without invoking .fields yet)
const uploadCatalogOnly = multer({ storage, fileFilter });

module.exports = uploadCatalogOnly;
