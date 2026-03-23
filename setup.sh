#!/bin/bash
# setup.sh - Initial setup for ADTRS

echo "Installing Backend Dependencies..."
cd backend && npm install
echo "Installing Frontend Dependencies..."
cd ../frontend && npm install

echo "Checking for PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "Creating Database 'adtrs_db'..."
    createdb adtrs_db || echo "Database might already exist."
    
    echo "Running Migration..."
    psql -d adtrs_db -f ../backend/database.sql
else
    echo "PostgreSQL client (psql) not found. Please ensure Postgres is installed and 'adtrs_db' is created manually."
fi

echo "Setup Complete!"
echo "Run 'cd backend && npm run dev' in one terminal"
echo "Run 'cd frontend && npm run dev' in another terminal"
