# Server Startup Guide

## Quick Start

### Option 1: Clean Start (Recommended)
```bash
npm run start:clean
```
This will automatically kill any existing processes on port 5000 and start the server.

### Option 2: Manual Start
```bash
npm start
```

## Troubleshooting Port 5000 Issues

If you encounter "EADDRINUSE" errors:

### Method 1: Use the clean start script
```bash
npm run start:clean
```

### Method 2: Manual port cleanup
```bash
# Kill processes on port 5000
lsof -ti:5000 | xargs kill -9

# Then start the server
npm start
```

### Method 3: Find and kill specific processes
```bash
# Find processes using port 5000
lsof -i:5000

# Kill specific process (replace PID with actual process ID)
kill -9 <PID>
```

## Server Status Check

Test if the server is running:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"OK","timestamp":"...","uptime":...}
```

## Development Mode

For development with auto-restart:
```bash
npm run dev
```

## Environment Variables

Make sure you have a `.env` file in the server directory with:
```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=healthcare_db
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

## Database Setup

Before starting the server, ensure the database is set up:
```bash
npm run migrate
npm run seed
```
