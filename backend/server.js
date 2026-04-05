const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const result = dotenv.config({ path: envPath });
console.log('Dotenv loading from:', envPath);
if (result.error) {
    console.error('Dotenv error:', result.error);
} else {
    console.log('NODE_ENV is:', process.env.NODE_ENV);
    console.log('DATABASE_URL is:', process.env.DATABASE_URL ? 'DEFINED' : 'UNDEFINED');
}

const isProduction = process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() === 'production';
console.log('Is Production Mode:', isProduction);

// DEBUG PATHS ON RENDER
const { execSync } = require('child_process');
try {
    console.log('Current Dir:', __dirname);
    console.log('Files in current dir:', execSync('ls -F').toString());
    console.log('Files in parent dir:', execSync('ls -F ..').toString());
    console.log('Checking for frontend/dist:', execSync('ls -d ../frontend/dist 2>&1 || echo "Not Found"').toString());
} catch (e) {
    console.log('Path debug error:', e.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

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

// Make uploads folder static
app.use('/uploads', express.static('uploads'));


if (isProduction) {
    const fs = require('fs');
    // Try two possible locations for the frontend folder
    const pathsToTry = [
        path.join(process.cwd(), 'frontend', 'dist'),          // Root-First
        path.join(process.cwd(), '..', 'frontend', 'dist'),     // Backend-First (Relative)
        path.join(__dirname, '..', 'frontend', 'dist')          // Legacy Relative
    ];

    let staticPath = null;
    for (const p of pathsToTry) {
        console.log('Checking static path:', p);
        if (fs.existsSync(p)) {
            staticPath = p;
            console.log('✅ FOUND static files at:', staticPath);
            break;
        }
    }

    if (staticPath) {
        app.use(express.static(staticPath));
        
        // SPA Catch-all middleware
        app.use((req, res) => {
            const indexPath = path.join(staticPath, 'index.html');
            res.sendFile(indexPath, (err) => {
                if (err) {
                    console.error('Error sending index.html:', err.message);
                    res.status(500).send('Found the folder, but index.html is missing. Check build logs.');
                }
            });
        });
    } else {
        app.use((req, res) => {
            console.error('❌ CRITICAL: Could not find frontend/dist in any expected location.');
            console.log('Working Directory:', process.cwd());
            console.log('Directory Content:', fs.readdirSync(process.cwd()));
            res.status(500).send('Cloud Error: Website files not found. Our diagnostics are running in your Render logs.');
        });
    }
} else {
    // Development Catch-all
    app.use((req, res) => {
        res.send(`
            <h1>ADTRS API - Development Mode</h1>
            <p>If you see this, the website is NOT in production mode.</p>
            <p><b>Current NODE_ENV:</b> "${process.env.NODE_ENV}"</p>
            <p><b>Expected:</b> "production"</p>
            <hr>
            <p>Please check your Render Environment settings for typos or extra spaces.</p>
        `);
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
