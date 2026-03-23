const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

// Fallback logic for isolated DB
const connectionString = process.env.DATABASE_URL || 'postgres://adtrs_admin:adtrs_password_secure@localhost:5433/adtrs_data';

const pool = new Pool({
    connectionString,
});

const migrate = async () => {
    try {
        console.log('Connecting to database...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS publications (
                publication_id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                abstract TEXT,
                authors TEXT[], -- Array of authors
                journal_name VARCHAR(255),
                doi VARCHAR(100),
                volume VARCHAR(50),
                issue VARCHAR(50),
                pages VARCHAR(50),
                publication_date DATE,
                keywords TEXT[],
                pdf_url TEXT,
                external_link TEXT,
                uploaded_by INTEGER REFERENCES users(user_id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Ignore duplicate object errors for the index using PL/pgSQL block
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM   pg_class c
                    JOIN   pg_namespace n ON n.oid = c.relnamespace
                    WHERE  c.relname = 'idx_publication_search'
                    AND    n.nspname = 'public'
                ) THEN
                    CREATE INDEX idx_publication_search ON publications USING gin(to_tsvector('english', title || ' ' || COALESCE(abstract, '')));
                END IF;
            END
            $$;
        `);
        console.log('Successfully created publications table and index.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
        console.log('Database connection closed.');
    }
};

migrate();
