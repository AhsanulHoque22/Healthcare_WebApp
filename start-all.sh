#!/bin/bash

# Healthcare Web App - Complete Startup Script
# This script starts both backend and frontend with proper cleanup

echo "🚀 Starting Healthcare Web App (Backend + Frontend)..."

# Kill any existing processes
echo "🔍 Cleaning up existing processes..."
lsof -ti:5000 | xargs -r kill -9 2>/dev/null
lsof -ti:3000 | xargs -r kill -9 2>/dev/null
sleep 2

# Start backend in background
echo "🎯 Starting backend server..."
cd /home/ahsanul-hoque/healthcare-web-app/server
npm start &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5000/api/admin/stats > /dev/null 2>&1; then
    echo "✅ Backend started successfully!"
else
    echo "❌ Backend failed to start!"
    exit 1
fi

# Start frontend in background
echo "🎯 Starting frontend client..."
cd /home/ahsanul-hoque/healthcare-web-app/client
npm start &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 8

# Check if frontend is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend started successfully!"
else
    echo "❌ Frontend failed to start!"
    exit 1
fi

echo ""
echo "🎉 Healthcare Web App is running!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    lsof -ti:5000 | xargs -r kill -9 2>/dev/null
    lsof -ti:3000 | xargs -r kill -9 2>/dev/null
    echo "✅ Servers stopped successfully!"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for processes
wait
