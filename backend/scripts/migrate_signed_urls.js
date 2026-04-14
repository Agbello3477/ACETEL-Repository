const db = require('../config/db');

async function migrate() {
    try {
        console.log('Starting Migration: Adding public_id column...');
        
        // Add column to theses
        await db.query(`
            ALTER TABLE theses 
            ADD COLUMN IF NOT EXISTS public_id TEXT;
        `);
        console.log('Added public_id to theses table.');

        // Add column to publications
        await db.query(`
            ALTER TABLE publications 
            ADD COLUMN IF NOT EXISTS public_id TEXT;
        `);
        console.log('Added public_id to publications table.');

        console.log('Migration Complete Successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration Failed:', err);
        process.exit(1);
    }
}

migrate();
