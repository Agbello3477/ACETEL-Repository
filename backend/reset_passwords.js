const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || 'postgres://adtrs_admin:adtrs_pass_2024@localhost:5433/adtrs_data';
const pool = new Pool({ connectionString });

async function resetPasswords() {
    try {
        console.log("Resetting passwords...");
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash('password123', salt);

        // Reset admin
        await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [newHash, 'admin@noun.edu.ng']);
        console.log("✅ admin@noun.edu.ng reset to 'password123'");

        // Reset test student
        await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [newHash, 'test2@noun.edu.ng']);
        console.log("✅ test2@noun.edu.ng reset to 'password123'");

    } catch (err) {
        console.error("Error resetting passwords", err);
    } finally {
        pool.end();
    }
}

resetPasswords();
