const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    console.log('Starting Phase 4 Migration...');
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Add supervisors array column if it doesn't exist
        console.log('1. Adding supervisors column to theses table...');
        await client.query(`
            ALTER TABLE theses 
            ADD COLUMN IF NOT EXISTS supervisors TEXT[];
        `);

        // 2. Migrate existing data
        console.log('2. Migrating existing supervisor_name data...');
        await client.query(`
            UPDATE theses 
            SET supervisors = ARRAY[supervisor_name] 
            WHERE supervisor_name IS NOT NULL AND supervisors IS NULL;
        `);

        // 3. Create Notifications Table
        console.log('3. Creating notifications table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(user_id),
                message TEXT NOT NULL,
                type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning'
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
