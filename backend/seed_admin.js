const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/adtrs_db'
});

async function seedAdmin() {
    try {
        const client = await pool.connect();

        const password = 'adminpassword123';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Role 'Centre Admin' match enum
        const res = await client.query(
            "INSERT INTO users (full_name, email, password_hash, role, staff_id) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING RETURNING *",
            ['Admin User', 'admin@noun.edu.ng', hashedPassword, 'Centre Admin', '12345']
        );

        if (res.rows.length > 0) {
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user already exists.');
        }

        client.release();
    } catch (err) {
        console.error('Error seeding admin:', err.message);
    } finally {
        await pool.end();
    }
}

seedAdmin();
