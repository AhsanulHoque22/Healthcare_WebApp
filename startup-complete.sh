#!/bin/bash

# ============================================================
# Healthcare Web App - Complete Startup Script
# Starts both Backend (port 5001) and Frontend (port 3000)
# ============================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "╔════════════════════════════════════════════════════════╗"
echo "║    Healthcare Web App - Complete Startup               ║"
echo "║         Backend: 5001 | Frontend: 3000                 ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
 
# Check if running from project root
if [ ! -f "package.json" ] && [ ! -d "server" ] && [ ! -d "client" ]; then
    echo "❌ Error: This script must be run from the project root directory"
    echo "   Run: cd /path/to/healthcare-web-app && bash startup-complete.sh"
    exit 1
fi

# Aggressive port cleanup
echo "🔧 Aggressive port cleanup..."
echo "   - Clearing port 3000..."
lsof -ti:3000 2>/dev/null | while read pid; do kill -9 $pid 2>/dev/null; done
sudo fuser -k 3000/tcp 2>/dev/null

echo "   - Clearing port 5001..."
lsof -ti:5001 2>/dev/null | while read pid; do kill -9 $pid 2>/dev/null; done
sudo fuser -k 5001/tcp 2>/dev/null

sleep 3
echo "✅ Ports cleared"
echo ""

# Start backend server
echo "📦 Starting Backend Server (Port 5001)..."
bash ./startup-server.sh &
SERVER_PID=$!
sleep 8

# Start frontend client  
echo ""
echo "📦 Starting Frontend Client (Port 3000)..."
bash ./startup-client.sh &
CLIENT_PID=$!
sleep 8

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║           🎉 All Services Started! 🎉                  ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║  Backend Server:  http://localhost:5001                ║"
echo "║  Frontend Client: http://localhost:3000                ║"
echo "║  Database:        localhost:3306                       ║"
echo "║                                                        ║"
echo "║  Backend Health:  http://localhost:5001/api/health     ║"
echo "║  API Base:        http://localhost:5001/api            ║"
echo "║                                                        ║"
echo "║  Press Ctrl+C to stop all services                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Wait for all background processes
wait

