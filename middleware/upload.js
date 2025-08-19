const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = file.fieldname === 'logoImage'
            ? path.join(__dirname, '../uploads/logos')
            : path.join(__dirname, '../uploads/manufacturer_catalogs');

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


// Export configured multer instance (without invoking .fields yet)
const upload = multer({ storage, fileFilter });

module.exports = upload;
