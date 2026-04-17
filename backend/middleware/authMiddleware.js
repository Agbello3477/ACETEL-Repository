const jwt = require('jsonwebtoken');
const db = require('../config/db');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (token) {
        try {

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded Token:', decoded);

            // Get user from the token. Decoded has user_id !!!
            const userResult = await db.query('SELECT user_id, email, role, programme, degree FROM users WHERE user_id = $1', [decoded.user_id]);
            req.user = userResult.rows[0];

            console.log('User found:', req.user);

            if (!req.user) {
                console.log('User not found in DB');
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error('Auth Error:', error.message);
            res.status(401).json({ message: 'Not authorized' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        console.log(`Checking Role: User=${req.user.role}, Required=${roles}`);
        // roles passed in might be ['Student'], ['Centre Admin', 'Super Admin']
        if (!roles.includes(req.user.role)) {
            console.log('Role mismatch');
            return res.status(403).json({ message: `User role ${req.user.role} is not authorized` });
        }
        next();
    };
};

module.exports = { protect, authorize };
