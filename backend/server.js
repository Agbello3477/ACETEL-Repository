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
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
} else {
    app.get('/', (req, res) => {
        res.send(`ADTRS API is running in Development mode. (NODE_ENV: "${process.env.NODE_ENV}")`);
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

// SPA Catch-all middleware (Must be last)
app.use((req, res) => {
    if (isProduction) {
        res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
    } else {
        res.status(404).json({ message: 'Not Found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
