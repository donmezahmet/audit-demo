#!/bin/bash

# Audit Dashboard Demo - Startup Script
# This script starts both backend and frontend servers

echo "======================================"
echo "🚀 Starting Audit Dashboard Demo"
echo "======================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd client && npm install && cd ..
fi

echo ""
echo "✅ Dependencies ready!"
echo ""
echo "Starting servers..."
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:5174"
echo ""
echo "🔐 Login with: admin / admin"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "======================================"
echo ""

# Start backend in background
node server.js &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 2

# Start frontend
cd client && npm run dev

# When frontend stops, also stop backend
kill $BACKEND_PID 2>/dev/null

