const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const path = require('path');

const fs = require('fs');
// Align .env loading with db.js (Root level)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('Dotenv loading from root:', envPath);
} else {
    // Fallback to backend/.env if root not found
    dotenv.config();
    console.log('Using default dotenv loading.');
}

const isProduction = process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() === 'production';

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure Upload Directories Exist (Hardened with Try-Catch)
const uploadPaths = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'uploads', 'theses'),
    path.join(process.cwd(), 'uploads', 'publications')
];

uploadPaths.forEach(p => {
    try {
        if (!fs.existsSync(p)) {
            fs.mkdirSync(p, { recursive: true });
            console.log('Created missing directory:', p);
        }
    } catch (dirErr) {
        console.warn(`Warning: Could not create directory ${p}. This is usually fine on ephemeral cloud environments like Render if you are using Cloudinary.`, dirErr.message);
    }
});

const rateLimit = require('express-rate-limit');

app.use(cors());
app.use(express.json());

// Ping / Heartbeat Endpoint (Defined FIRST for reliability)
app.get('/api/ping', (req, res) => {
    res.json({ 
        status: 'alive', 
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development'
    });
});

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    // Only log body for small non-file requests to prevent console lag
    if (req.body && !req.body.pdf) {
        // console.log('Body:', req.body);
    }
    next();
});

// Rate Limiting (Relaxed for testing and resiliency)
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // Reduced to 5 minutes
    max: 1000, // Increased to 1000 requests to prevent blocking legitimate users during troubleshooting
    message: { message: 'Too many requests, please try again later.' }
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
}

// Global Error Handler (The Safety Net for Silent 500s)
app.use((err, req, res, next) => {
    console.error('SERVER CRASH CAPTURED:', err);
    // Removed DB logging in error handler to prevent further hanging if DB is full

    res.status(500).json({
        status: 'Error',
        message: 'A critical server error occurred.',
        error: err.message,
        stack: err.stack,
        path: req.url
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (0.0.0.0)`);
});
