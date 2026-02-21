# 🚀 Healthcare Web App - Startup Guide

## 🛠️ Permanent Fixes Applied

### 1. Port Conflict Resolution
- **Problem**: `Error: listen EADDRINUSE: address already in use :::5000`
- **Solution**: Created startup scripts that automatically kill existing processes

### 2. Login Token Expiration
- **Problem**: Login fails after some time due to JWT token expiration
- **Solution**: 
  - Extended JWT token expiration from 7 days to 30 days
  - Added automatic token expiration handling with user-friendly messages

## 🎯 Quick Start Commands

### Option 1: Start Everything at Once (Recommended)
```bash
./start-all.sh
```
This will:
- Kill any existing processes on ports 5000 and 3000
- Start backend server
- Start frontend client
- Show status of both servers

### Option 2: Start Individually
```bash
# Start backend only
./start-backend.sh

# Start frontend only (in another terminal)
./start-frontend.sh
```

### Option 3: Using npm scripts
```bash
# Clean and restart everything
npm run restart

# Or start everything
npm run start-all

# Or clean ports only
npm run clean
```

## 🔧 Manual Commands

If scripts don't work, use these manual commands:

### Kill existing processes
```bash
# Kill processes on port 5000 (backend)
lsof -ti:5000 | xargs -r kill -9

# Kill processes on port 3000 (frontend)
lsof -ti:3000 | xargs -r kill -9

# Or kill all node processes
pkill -f "node"
```

### Start servers manually
```bash
# Start backend
cd server && npm start

# Start frontend (in another terminal)
cd client && npm start
```

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Admin Panel**: http://localhost:3000/admin-dashboard
- **Patient Lab Reports**: http://localhost:3000/lab-reports

## 🔐 Test Credentials

### Admin Account (Working)
- **Email**: ratulahr124@gmail.com
- **Password**: password123

### Admin Account (Alternative)
- **Email**: admin@healthcare.com
- **Password**: (Need to reset or check database)

### Patient Account
- **Email**: ahsanulcsecu@gmail.com
- **Password**: (Need to reset or check database)

### Test Patient Account
- **Email**: test.patient@example.com
- **Password**: password123

## 🚨 Troubleshooting

### Port Still in Use?
```bash
# Check what's using the port
lsof -i:5000
lsof -i:3000

# Force kill specific process
kill -9 <PID>
```

### Login Issues?
1. Check if backend is running: `curl http://localhost:5000/api/admin/stats`
2. Clear browser cache and localStorage
3. Check browser console for errors
4. Verify credentials in database

### Database Issues?
```bash
cd server
npx sequelize db:migrate
npx sequelize db:seed:all
```

## 📝 Notes

- JWT tokens now expire in 30 days instead of 7 days
- Automatic token expiration handling shows user-friendly messages
- All startup scripts include automatic cleanup of existing processes
- Use `Ctrl+C` to stop the `start-all.sh` script cleanly

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Backend shows: "Server running on port 5000"
- ✅ Frontend shows: "webpack compiled successfully"
- ✅ You can access http://localhost:3000 without errors
- ✅ You can log in with admin credentials
