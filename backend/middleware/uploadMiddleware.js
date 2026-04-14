const multer = require('multer');
const path = require('path');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

let storage;

if (process.env.CLOUDINARY_CLOUD_NAME) {
    // Cloudinary Config
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: (req) => {
                let sub = 'misc';
                if (req.baseUrl.includes('theses') || req.originalUrl.includes('theses')) sub = 'theses';
                else if (req.baseUrl.includes('publications') || req.originalUrl.includes('publications')) sub = 'publications';
                return `ADTRS/${sub}`;
            },
            resource_type: 'auto',
            format: async (req, file) => 'pdf',
            public_id: (req, file) => `file-${Date.now()}`
        },
    });
    console.log('Upload Middleware: Cloudinary Storage Initialized');
} else {
    // Fallback to local disk storage
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            let subFolder = '';
            if (req.baseUrl.includes('theses') || req.originalUrl.includes('theses')) {
                subFolder = 'theses';
            } else if (req.baseUrl.includes('publications') || req.originalUrl.includes('publications')) {
                subFolder = 'publications';
            }
            const destinationPath = path.join(process.cwd(), 'uploads', subFolder);
            cb(null, destinationPath);
        },
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        },
    });
    console.log('Upload Middleware: Local Disk Storage Initialized (Fallback)');
}

// Check file type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /pdf/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
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
