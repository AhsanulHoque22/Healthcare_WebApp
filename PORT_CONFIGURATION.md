# Healthcare Web App - Port Configuration & Startup Guide

## Single Point of Truth - Port Configuration

This document defines the DEFINITIVE port configuration for this project. **No exceptions.**

### Standard Ports
- **Frontend Client**: Port **3000**
- **Backend Server**: Port **5000**
- **MySQL Database**: Port **3306**

### Configuration Files (Do NOT Change)
All ports are configured in these files:

#### Server (Backend)
- **File**: `server/.env`
  ```
  PORT=5000
  CLIENT_URL=http://localhost:3000
  ```

#### Client (Frontend)
- **File**: `client/.env`
  ```
  REACT_APP_API_URL=http://localhost:5000/api
  ```

#### NPM Scripts
Both `package.json` files include automatic port cleanup:

**Server** (`server/package.json`):
```json
"start": "lsof -ti:5000 | xargs kill -9 2>/dev/null; sleep 1; node index.js"
```

**Client** (`client/package.json`):
```json
"start": "lsof -ti:3000 | xargs kill -9 2>/dev/null; sleep 1; react-scripts start"
```

---

## ✅ How to Start the Application

### Option 1: Start Both Services (Recommended)
```bash
cd /path/to/healthcare-web-app
bash startup-complete.sh
```

### Option 2: Start Services Individually

**Terminal 1 - Backend Server:**
```bash
cd /path/to/healthcare-web-app
cd server
npm start
# Or directly:
cd /path/to/healthcare-web-app/server && PORT=5000 node index.js
```

**Terminal 2 - Frontend Client:**
```bash
cd /path/to/healthcare-web-app
cd client
npm start
```

### Option 3: Direct ng Start Commands
```bash
# Server
cd server && npm start

# Client (in another terminal)
cd client && npm start
```

---

## 🔧 Troubleshooting Port Issues

### Issue: Port Already in Use

**For Port 5000:**
```bash
# Option 1: Kill using lsof
lsof -ti:5000 | xargs kill -9

# Option 2: Kill using fuser
sudo fuser -k 5000/tcp

# Option 3: Kill using PID
ps aux | grep node
kill -9 <PID>
```

**For Port 3000:**
```bash
lsof -ti:3000 | xargs kill -9
```

### Issue: Multiple Node Processes
```bash
# Kill ALL node processes
killall -9 node
# Or
pkill -9 -f node
```

---

## 📡 Service Verification

### Check if Services are Running
```bash
# Check port 5000 (Backend)
curl http://localhost:5000/api/health

# Check port 3000 (Frontend)
curl http://localhost:3000/
```

### View Active Ports
```bash
# Check specific ports
lsof -i :3000
lsof -i :5000
lsof -i :3306

# View all listening ports
netstat -tuln
# or
ss -tuln
```

---

## 🚀 Startup Scripts

All startup scripts are configured to automatically clean ports before starting:

1. **`startup-server.sh`** - Start backend server on port 5000
   - Kills any existing process on port 5000
   - Starts Node.js server
   - Verifies .env configuration

2. **`startup-client.sh`** - Start frontend client on port 3000
   - Kills any existing process on port 3000  
   - Starts React dev server
   - Verifies .env configuration

3. **`startup-complete.sh`** - Start both services
   - Cleans both ports 3000 and 5000
   - Starts backend server
   - Starts frontend client
   - Shows unified status

---

## ✨ IMPORTANT NOTES

1. **DO NOT** change ports in .env files
2. **DO NOT** modify startup script port numbers
3. **DO NOT** use different ports in different environments (unless production)
4. If port conflicts occur, investigate what other service is using that port
5. The npm start scripts are configured to auto-clean ports  
6. Always use the startup scripts for consistent behavior

---

## 📊 Database Connection

The application connects to MySQL on port **3306**:
```
Host: localhost
Port: 3306
User: root
Password: 7878
Database: healthcare_db
```

Configuration: `server/.env`
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=healthcare_db
DB_USER=root
DB_PASSWORD=7878
```

---

## 🔗 Access URLs

Once all services are running:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health
- **Database**: localhost:3306 (MySQL)
