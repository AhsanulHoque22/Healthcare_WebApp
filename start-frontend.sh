#!/bin/bash

# Healthcare Web App - Frontend Startup Script
# This script ensures clean startup of the frontend client

echo "🚀 Starting Healthcare Web App Frontend..."

# Kill any existing processes on port 3000
echo "🔍 Checking for existing processes on port 3000..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Found existing processes on port 3000. Killing them..."
    lsof -ti:3000 | xargs -r kill -9
    sleep 2
fi

# Change to client directory
cd /home/ahsanul-hoque/healthcare-web-app/client

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the client
echo "🎯 Starting frontend client on port 3000..."
npm start

echo "✅ Frontend client started successfully!"
