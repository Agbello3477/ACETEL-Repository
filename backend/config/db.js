const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log("Environment PGUSER:", process.env.PGUSER); // Debug pollution

// Fallback parsing just in case
const match = process.env.DATABASE_URL ? process.env.DATABASE_URL.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/) : null;
const config = match ? {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10
} : {
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10
};

console.log("Explicit DB Config Used:", { ...config, password: '***' });

const pool = new Pool(config);

pool.on('error', (err) => {
    console.error('Unexpected Error on Idle Client', err);
    process.exit(-1);
});


pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database');
});

module.exports = {
    query: async (text, params) => {
        const start = Date.now();
        console.log('Executing query:', { text, params }); // Log query start
        try {
            const res = await pool.query(text, params);
            const duration = Date.now() - start;
            console.log('Executed query', { text, duration, rows: res.rowCount }); // Log query end
            return res;
        } catch (error) {
            console.error('Query error', { text, error });
            throw error;
        }
    },
};
