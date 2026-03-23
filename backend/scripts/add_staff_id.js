const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    try {
        const client = await pool.connect();

        console.log("Checking if staff_id column exists...");

        // Add staff_id column if it doesn't exist
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='staff_id') THEN 
                    ALTER TABLE users ADD COLUMN staff_id VARCHAR(50); 
                    RAISE NOTICE 'Added staff_id column';
                ELSE 
                    RAISE NOTICE 'staff_id column already exists';
                END IF; 
            END $$;
        `);

        console.log("Migration completed successfully.");
        client.release();
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
