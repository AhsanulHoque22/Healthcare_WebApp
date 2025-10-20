#!/bin/bash

# Healthcare Web App Server Startup Script
# This script kills any existing processes on port 5000 and starts the server

echo "🚀 Starting Healthcare Web App Server..."

# Kill any existing process on port 5000
echo "🔍 Checking for existing processes on port 5000..."
PID=$(lsof -ti:5000)
if [ ! -z "$PID" ]; then
    echo "⚠️  Found existing process $PID on port 5000. Killing it..."
    kill -9 $PID
    sleep 2
    echo "✅ Process killed successfully"
else
    echo "✅ Port 5000 is available"
fi

# Start the server
echo "🚀 Starting server..."
cd server && npm start
