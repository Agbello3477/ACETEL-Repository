const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const createAdmin = async () => {
    try {
        const email = 'superadmin@acetel.noun.edu.ng';
        const password = 'SuperAdmin2024!';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user exists
        const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (check.rows.length > 0) {
            // Update existing
            await pool.query(
                'UPDATE users SET password_hash = $1, role = $2, full_name = $3 WHERE email = $4',
                [hashedPassword, 'Super Admin', 'System Administrator', email]
            );
            console.log('Super Admin updated successfully.');
        } else {
            // Insert new
            await pool.query(
                'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                ['System Administrator', email, hashedPassword, 'Super Admin']
            );
            console.log('Super Admin created successfully.');
        }

        console.log(`\nCredentials created:\nEmail: ${email}\nPassword: ${password}\n`);
        process.exit(0);
    } catch (err) {
        console.error('Error creating admin:', err);
        process.exit(1);
    }
};

createAdmin();
