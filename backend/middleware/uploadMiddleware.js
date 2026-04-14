const multer = require('multer');
const path = require('path');

const cloudinary = require('../config/cloudinaryConfig');

// Configure Cloudinary (Middleware uses the central config now)
console.log('Upload Middleware: Cloudinary Connected');

// Set storage engine to memory
// This holds the file in RAM temporarily so the controller can stream it to Cloudinary
const storage = multer.memoryStorage();

// Check file type
function checkFileType(file, cb) {
    const filetypes = /pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: PDFs Only!');
    }
}

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // 10MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
});

module.exports = upload;
