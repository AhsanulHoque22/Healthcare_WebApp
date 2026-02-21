#!/bin/bash

# ============================================================
# Healthcare Web App - Backend Server Startup Script
# Port: 5000 (Single Point of Truth)
# ============================================================

PORT=5000
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Healthcare Backend Server Startup"
echo "=================================="

# Kill any process on port 5000 -AGGRESSIVE CLEANUP
echo "🔧 Aggressively clearing port $PORT..."

# Method 1: lsof
lsof -ti:$PORT 2>/dev/null | while read pid; do
    echo "  → Killing PID $pid (lsof)"
    kill -9 $pid 2>/dev/null
done

# Method 2: fuser
sudo fuser -k $PORT/tcp 2>/dev/null && echo "  → Killed via fuser"

# Method 3: netstat + awk (backup)
netstat -tuln 2>/dev/null | grep ":$PORT " | grep LISTEN && {
    PID=$(netstat -tuln 2>/dev/null | grep ":$PORT " | awk '{print $NF}' | cut -d'/' -f1)
    [ !  -z "$PID" ] && kill -9 $PID 2>/dev/null && echo "  → Killed via netstat ($PID)"
}

sleep 2

if lsof -i :$PORT >/dev/null 2>&1; then
    echo "⚠️  Port $PORT still in use. Waiting..."
    sleep 3
fi

echo "✅ Port $PORT ready"
echo ""

# Navigate to server directory
cd "$PROJECT_DIR/server" || { echo "❌ Failed to navigate to server directory"; exit 1; }

# Verify .env file
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found in server directory"
    exit 1
fi

echo "📦 Starting backend server..."
echo "   - Port: $PORT"
echo "   - Database: http://localhost:3306"
echo "   - Client URL: http://localhost:3000"
echo ""

# Start with explicit PORT variable
PORT=5000 npm start

