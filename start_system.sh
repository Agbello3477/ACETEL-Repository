#!/bin/bash

# ADTRS System Startup Script
# Usage: ./start_system.sh

echo "=================================================="
echo "   ACETEL Digital Thesis Repository System (ADTRS)"
echo "             System Startup Script"
echo "=================================================="

# Function to check if a port is in use
check_port() {
    lsof -i:$1 >/dev/null 2>&1
}

# Kill existing processes
echo "[INFO] Stopping existing services..."
pkill -f "node server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

# Start Backend
echo "[INFO] Starting Backend Server..."
cd "/Users/abdulgaffarbello/ACETEL Digital Thesis Repository System (ADTRS)/backend"
npm start > backend.log 2>&1 &
BACKEND_PID=$!
echo "[SUCCESS] Backend started (PID: $BACKEND_PID). Logs: backend/backend.log"

# Start Frontend
echo "[INFO] Starting Frontend Server..."
cd "/Users/abdulgaffarbello/ACETEL Digital Thesis Repository System (ADTRS)/frontend"
npm run dev -- --host 127.0.0.1 > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "[SUCCESS] Frontend started (PID: $FRONTEND_PID). Logs: frontend/frontend.log"

echo "=================================================="
echo "System is running!"
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:5174"
echo ""
echo "To stop the system, run: pkill -f 'node server.js' && pkill -f 'vite'"
echo "=================================================="
