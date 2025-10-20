#!/bin/bash

# Healthcare Web App - Backend Startup Script
# This script ensures clean startup of the backend server

echo "🚀 Starting Healthcare Web App Backend..."

# Kill any existing processes on port 5000
echo "🔍 Checking for existing processes on port 5000..."
if lsof -ti:5000 > /dev/null 2>&1; then
    echo "⚠️  Found existing processes on port 5000. Killing them..."
    lsof -ti:5000 | xargs -r kill -9
    sleep 2
fi

# Change to server directory
cd /home/ahsanul-hoque/healthcare-web-app/server

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🎯 Starting backend server on port 5000..."
npm start

echo "✅ Backend server started successfully!"
