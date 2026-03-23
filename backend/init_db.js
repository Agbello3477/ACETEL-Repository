const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Parse DATABASE_URL if available, else use default config
const connectionString = process.env.DATABASE_URL;

const dbConfig = connectionString ? { connectionString } : {
    user: 'postgres',
    host: 'localhost',
    password: 'postgres',
    port: 5432,
};

async function initDB() {
    try {
        console.log("Connecting to postgres to check/create adtrs_db...");
        // Connect to 'postgres' db to create new db
        // If connectionString is used, we need to modify it to connect to 'postgres' database instead of 'adtrs_db'
        // This is a bit tricky with connection strings. For simplicity, we'll try to rely on individual params if possible, 
        // or just assume local defaults if connectionString is not flexible.
        // For this script, let's assume standard local dev setup.

        const rootConfig = {
            user: 'admin',
            host: 'localhost',
            password: 'admin123',
            port: 5432,
            database: 'postgres'
        };

        const rootPool = new Pool(rootConfig);

        try {
            const dbRes = await rootPool.query("SELECT 1 FROM pg_database WHERE datname = 'adtrs_db'");
            if (dbRes.rows.length === 0) {
                console.log("Creating database 'adtrs_db'...");
                await rootPool.query('CREATE DATABASE adtrs_db');
                console.log("Database created.");
            } else {
                console.log("Database 'adtrs_db' already exists.");
            }
        } catch (e) {
            console.log("Error checking/creating DB (might already exist or permission issue):", e.message);
        }
        await rootPool.end();

        // 2. Connect to the new database and run schema
        console.log("Connecting to 'adtrs_db' to apply schema...");
        const dbPool = new Pool({
            connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/adtrs_db'
        });

        const schemaPath = path.join(__dirname, 'database.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        await dbPool.query(schemaSql);
        console.log("Schema applied successfully.");
        await dbPool.end();

    } catch (err) {
        console.error("Error initializing database:", err);
    }
}

initDB();
