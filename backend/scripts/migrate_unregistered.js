const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const migrate = async () => {
    try {
        console.log('Starting migration...');

        // 1. Add columns if not exist
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='theses' AND column_name='author_name') THEN
                    ALTER TABLE theses ADD COLUMN author_name VARCHAR(255);
                END IF;

                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='theses' AND column_name='matric_number') THEN
                    ALTER TABLE theses ADD COLUMN matric_number VARCHAR(50);
                END IF;
            END $$;
        `);
        console.log('Columns added.');

        // 2. Make author_id nullable
        await pool.query(`ALTER TABLE theses ALTER COLUMN author_id DROP NOT NULL;`);
        console.log('author_id is now nullable.');

        // 3. Backfill data from users table
        await pool.query(`
            UPDATE theses t
            SET author_name = u.full_name,
                matric_number = u.matric_number
            FROM users u
            WHERE t.author_id = u.user_id
            AND (t.author_name IS NULL OR t.matric_number IS NULL);
        `);
        console.log('Backfill complete.');

        console.log('Migration successful.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
};

migrate();
