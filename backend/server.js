const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const path = require('path');

const fs = require('fs');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('Dotenv loading from:', envPath);
} else {
    console.log('No .env file found; assuming environment variables are provided by the platform (e.g., Render).');
}

const isProduction = process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() === 'production';

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure Upload Directories Exist
const uploadPaths = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'uploads', 'theses'),
    path.join(process.cwd(), 'uploads', 'publications')
];

uploadPaths.forEach(p => {
    if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
        console.log('Created missing directory:', p);
    }
});

const rateLimit = require('express-rate-limit');

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Body:', req.body);
    next();
});

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/theses', require('./routes/thesisRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/publications', require('./routes/publicationRoutes'));

// Make uploads folder static - Using absolute path from process root
const absoluteUploadPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(absoluteUploadPath));

// 404 handler for uploads to prevent SPA catch-all from masking missing files
app.use('/uploads', (req, res) => {
    res.status(404).json({ 
        message: 'File not found on server. Please check if the upload exists.',
        debug_info: `Checked path: ${path.join(absoluteUploadPath, req.url)}`
    });
});

// Diagnostics Route
app.get('/api/debug/files', async (req, res) => {
    const fs = require('fs');
    const rootUploads = path.join(process.cwd(), 'uploads');
    
    const getContents = (dir) => {
        try {
            return fs.existsSync(dir) ? fs.readdirSync(dir) : ['Directory Missing'];
        } catch (e) { return [e.message]; }
    };

    res.json({
        cwd: process.cwd(),
        dirname: __dirname,
        root: rootUploads,
        exists: fs.existsSync(rootUploads),
        is_production: isProduction,
        disk_structure: {
            root: getContents(rootUploads),
            theses: getContents(path.join(rootUploads, 'theses')),
            publications: getContents(path.join(rootUploads, 'publications'))
        }
    });
});


if (isProduction) {
    const fs = require('fs');
    // Search for frontend/dist in root-first or backend-relative order
    const pathsToTry = [
        path.join(process.cwd(), 'frontend', 'dist'),
        path.join(process.cwd(), '..', 'frontend', 'dist')
    ];

    let staticPath = null;
    for (const p of pathsToTry) {
        if (fs.existsSync(p)) {
            staticPath = p;
            break;
        }
    }

    if (staticPath) {
        app.use(express.static(staticPath));
        // SPA Catch-all resolver
        app.use((req, res) => {
            res.sendFile(path.join(staticPath, 'index.html'));
        });
    }
} else {
    app.get('/', (req, res) => {
        res.send('ADTRS API is running in Development mode. (Use NODE_ENV=production to serve website)');
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
