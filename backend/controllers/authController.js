const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ user_id: id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    // Map frontend fields to backend schema
    // Frontend sends: name, email, password, role, matric_no, programme, degree_type, staff_id
    const { name, email, password, role, matric_no, programme, degree_type, staff_id } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please add all required fields' });
    }

    // Email Domain Validation
    if (!email.endsWith('@noun.edu.ng')) {
        return res.status(400).json({ message: 'Email must be a valid @noun.edu.ng address' });
    }

    // Map Role to Enum
    // Frontend: student, centre_admin -> Backend: Student, Centre Admin
    let dbRole = 'Student';
    if (role === 'centre_admin') dbRole = 'Centre Admin';
    else if (role === 'super_admin') dbRole = 'Super Admin';
    else if (role === 'student') dbRole = 'Student';

    // Map Programme to Enum
    // Backend Enum: 'Artificial Intelligence', 'Cyber Security', 'Management Information System'
    // Frontend might send 'AI', 'Cybersecurity', 'MIS' - need to map
    let dbProgramme = null;
    if (programme === 'AI') dbProgramme = 'Artificial Intelligence';
    else if (programme === 'Cybersecurity') dbProgramme = 'Cyber Security';
    else if (programme === 'MIS') dbProgramme = 'Management Information System';
    else if (programme && programme.trim() !== '') dbProgramme = programme;

    // Ensure Programme is NULL for non-students (or if explicit empty string sent)
    if (dbRole !== 'Student' && (!programme || programme.trim() === '')) {
        dbProgramme = null;
    }

    if (dbRole === 'Student' && !dbProgramme) {
        return res.status(400).json({ message: 'Programme is required for Students' });
    }

    const validProgrammes = ['Artificial Intelligence', 'Cyber Security', 'Management Information System'];
    if (dbRole === 'Student' && !validProgrammes.includes(dbProgramme)) {
        return res.status(400).json({ message: 'Invalid Programme selected' });
    }

    // Handle Staff ID for Admins
    let dbStaffId = null;
    if (dbRole !== 'Student') {
        if (!staff_id || staff_id.trim() === '') {
            return res.status(400).json({ message: 'Staff ID is required for Admins' });
        }
        if (!/^\d{5}$/.test(staff_id)) {
            return res.status(400).json({ message: 'Staff ID must be exactly 5 digits' });
        }
        dbStaffId = staff_id;
    }

    // Ensure matric_number is NULL if empty string or irrelevant (non-Students)
    let dbMatricNumber = matric_no;
    if (!dbMatricNumber || dbMatricNumber.trim() === '' || dbRole !== 'Student') {
        dbMatricNumber = null;
    }


    try {
        // Check if user exists (Email)
        const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if Matric Number exists (for Students)
        if (dbRole === 'Student' && dbMatricNumber) {
            const matricExists = await db.query('SELECT * FROM users WHERE matric_number = $1', [dbMatricNumber]);
            if (matricExists.rows.length > 0) {
                return res.status(400).json({ message: 'Matric Number already registered' });
            }
        }

        // Check if Staff ID exists (for Admins)
        if (dbRole !== 'Student' && dbStaffId) {
            const staffExists = await db.query('SELECT * FROM users WHERE staff_id = $1', [dbStaffId]);
            if (staffExists.rows.length > 0) {
                return res.status(400).json({ message: 'Staff ID already registered' });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Explicit NULL check final safeguard
        if (dbProgramme === '') dbProgramme = null;



        // Create user
        const newUser = await db.query(
            'INSERT INTO users (full_name, email, password_hash, role, matric_number, programme, degree, staff_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [name, email, hashedPassword, dbRole, dbMatricNumber, dbProgramme, degree_type, dbStaffId]
        );

        const user = newUser.rows[0];

        res.status(201).json({
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role, // "Student"
            degree: user.degree,
            token: generateToken(user.user_id, user.role),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    try {
        // Check for user email
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user) {
            console.log('User not found');
            return res.status(400).json({ message: 'Invalid credentials (User)' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log(`Password match: ${isMatch}`);

        if (user && isMatch) {
            res.json({
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                programme: user.programme,
                degree: user.degree,
                matric_number: user.matric_number,
                staff_id: user.staff_id,
                token: generateToken(user.user_id, user.role),
            });
        } else {
            console.log('Password mismatch');
            res.status(400).json({ message: 'Invalid credentials (Pass)' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const userResult = await db.query('SELECT user_id, full_name, email, role, matric_number, programme, degree, staff_id FROM users WHERE user_id = $1', [req.user.user_id]);
        res.status(200).json(userResult.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    register,
    login,
    getMe,
};
