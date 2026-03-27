#!/bin/bash

# ============================================================
# Healthcare Web App - Frontend Client Startup Script
# Port: 3000 (Single Point of Truth)
# ============================================================

PORT=3000
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Healthcare Frontend Client Startup"
echo "===================================="

# Kill any process on port 3000 - AGGRESSIVE CLEANUP
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
    [ ! -z "$PID" ] && kill -9 $PID 2>/dev/null && echo "  → Killed via netstat ($PID)"
}

sleep 2

if lsof -i :$PORT >/dev/null 2>&1; then
    echo "⚠️  Port $PORT still in use. Waiting..."
    sleep 3
fi

echo "✅ Port $PORT ready"
echo ""

# Navigate to client directory
cd "$PROJECT_DIR/client" || { echo "❌ Failed to navigate to client directory"; exit 1; }

# Verify .env file
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found in client directory"
    exit 1
fi

echo "📦 Starting frontend client..."
echo "   - Port: $PORT"
echo "   - API Base URL: http://localhost:5001/api"
echo ""

# Start React dev server
PORT=3000 npm start

