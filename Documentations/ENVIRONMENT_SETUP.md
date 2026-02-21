# Environment Configuration Guide

## 📋 Overview

This project uses a **single `.env` file as the source of truth** for all database credentials and configuration. All other files (docker-compose.yml, config files, source code) reference variables from this `.env` file.

---

## 🎯 Single Source of Truth Architecture

### Configuration Flow

```
server/.env (SINGLE SOURCE OF TRUTH)
    ↓
    ├→ docker-compose.yml (reads ${VAR} placeholders)
    ├→ server/config/database.js (reads process.env.*)
    ├→ server/index.js (reads process.env.*)
    └→ All other server files (read process.env.*)
```

---

## 📁 Files Involved

### Files That Reference Database Credentials

| File | Purpose | Variables Used | Auto-Updated? |
|------|---------|-----------------|---------------|
| `server/.env` | Source of Truth | All credentials | N/A |
| `docker-compose.yml` | Docker Configuration | `${DB_*}`, `${JWT_*}`, `${CLIENT_URL}` | ✅ YES |
| `server/config/database.js` | Sequelize Connection | `process.env.DB_*` | ✅ YES |
| `server/index.js` | Server Setup | `process.env.CLIENT_URL` | ✅ YES |
| `server/config/bkash.js` | Payment Config | `process.env.BKASH_*` | ✅ YES |
| `server/services/bkashService.js` | Payment Service | `process.env.BKASH_*` | ✅ YES |
| `server/controllers/authController.js` | Auth Logic | `process.env.CLIENT_URL` | ✅ YES |

### Files NOT to Change
- ❌ `server/config/config.json` - **DELETED** (was unused)
- ❌ `server/.env.save` - **DELETED** (was old backup)

---

## 🚀 Deployment Scenarios

### Scenario 1: Local Development

**File: `server/.env`**
```env
NODE_ENV=development
DB_HOST=localhost          # ← Use localhost for direct MySQL access
DB_PORT=3306              # ← Your local MySQL port
DB_NAME=healthcare_db
DB_USER=root
DB_PASSWORD=your_password
CLIENT_URL=http://localhost:3000
# ... other configs
```

**How it works:**
- Application connects directly to MySQL on your machine
- No Docker needed - just run `npm start` in server directory
- Database accessed via `localhost:3306`

---

### Scenario 2: Docker Deployment (Same Machine)

**File: `server/.env`**
```env
NODE_ENV=production
DB_HOST=mysql             # ← Use "mysql" for Docker networking
DB_PORT=3306
DB_NAME=healthcare_db
DB_USER=healthcare_user
DB_PASSWORD=secure_password_here
CLIENT_URL=http://localhost:3001
JWT_SECRET=your-secure-jwt-secret
# ... other configs
```

**Setup & Run:**
```bash
# Navigate to project root
cd /home/ahsanul-hoque/healthcare-web-app

# Ensure .env file exists with above values
cat server/.env

# Start all services with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f mysql

# Access services
# Frontend: http://localhost:3001
# Backend API: http://localhost:5002/api
```

**How it works:**
- MySQL runs in a Docker container named `mysql`
- Backend connects to MySQL using the service name `mysql` (Docker DNS resolves it)
- Frontend runs on port 3001 (via nginx)
- Backend runs on port 5002 (mapped from container port 5000)

---

### Scenario 3: Docker Deployment (Different Machine)

**File: `server/.env`**
```env
NODE_ENV=production
DB_HOST=mysql                    # ← Still "mysql" for Docker networking
DB_PORT=3306
DB_NAME=healthcare_db
DB_USER=healthcare_user
DB_PASSWORD=very_secure_password
CLIENT_URL=https://yourdomain.com  # ← Change this!
JWT_SECRET=change-this-to-long-secure-key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
# ... other configs
```

**Setup & Run:**
```bash
# Copy project files to new machine
scp -r /home/ahsanul-hoque/healthcare-web-app user@newmachine:/home/user/

# SSH into new machine
ssh user@newmachine

# Navigate to project
cd /home/user/healthcare-web-app

# Update .env with correct credentials for new machine
nano server/.env
# - Change DB_PASSWORD to new credentials
# - Change CLIENT_URL to new domain/IP
# - Update SMTP credentials if needed

# Start services
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs backend
```

---

## 📝 Complete .env Template

```env
# ============================================================
# ENVIRONMENT CONFIGURATION - SINGLE SOURCE OF TRUTH
# ============================================================
NODE_ENV=development
PORT=5000

# ============================================================
# DATABASE CONFIGURATION
# For LOCAL DEVELOPMENT: DB_HOST=localhost, DB_PORT=3306
# For DOCKER DEPLOYMENT: DB_HOST=mysql, DB_PORT=3306
# ============================================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=healthcare_db
DB_USER=root
DB_PASSWORD=your_password

# ============================================================
# JWT CONFIGURATION
# ============================================================
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRE=7d

# ============================================================
# CLIENT CONFIGURATION
# For LOCAL: http://localhost:3000
# For DOCKER: http://localhost:3001 or your domain
# ============================================================
CLIENT_URL=http://localhost:3000

# ============================================================
# EMAIL CONFIGURATION
# ============================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@healthcare.com

# ============================================================
# FILE UPLOAD & RATE LIMITING
# ============================================================
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================================
# OPTIONAL: BKASH PAYMENT
# ============================================================
# BKASH_USERNAME=your_username
# BKASH_PASSWORD=your_password
# BKASH_APP_KEY=your_app_key
# BKASH_APP_SECRET=your_secret
# BKASH_CALLBACK_URL=http://localhost:3000/payment/callback
```

---

## ✅ Configuration Verification

To verify all configurations are correctly linked:

```bash
# 1. Check .env file exists and has required variables
cat server/.env

# 2. Verify docker-compose.yml reads from .env
grep -E "DB_|JWT_|CLIENT_URL" docker-compose.yml

# 3. Test database connection locally
cd server
npm install  # if not done
node -e "require('dotenv').config(); const db = require('./config/database'); console.log('✅ DB Config loaded');"

# 4. For Docker: verify containers can communicate
docker-compose config  # validates docker-compose.yml
docker-compose up -d
docker-compose exec backend echo "✅ Backend running"
docker-compose exec mysql mysql -u root -p -e "SELECT 1;" 2>/dev/null && echo "✅ MySQL accessible"
```

---

## 🔄 Changing Credentials

### To update database credentials:

```bash
# 1. Edit server/.env
nano server/.env

# 2. Change the values
DB_PASSWORD=new_password
DB_USER=new_user
CLIENT_URL=new_url

# 3. Save file (Ctrl+X, Y, Enter)

# 4. Restart services
docker-compose down
docker-compose up -d
# OR for local dev
npm start
```

**That's it!** All files automatically use the new values. No need to change other files.

---

## 🐛 Troubleshooting

### Issue: "Can't connect to MySQL"

**Check:**
1. `DB_HOST` value in `server/.env`
   - Local dev: should be `localhost`
   - Docker: should be `mysql`
2. `DB_PORT` matches your MySQL port
3. `DB_USER` and `DB_PASSWORD` are correct

### Issue: "JWT token invalid"

**Check:**
1. `JWT_SECRET` is set in `.env`
2. All deployed instances use the SAME `JWT_SECRET`
3. `JWT_EXPIRE` is set correctly

### Issue: "Email not sending"

**Check:**
1. `SMTP_*` variables are correct in `.env`
2. For Gmail: Use App Password (not regular password)
3. `FROM_EMAIL` matches your SMTP_USER

### Issue: "Frontend can't reach backend"

**Check:**
1. `CLIENT_URL` in `.env` is correct
2. Frontend API base URL matches your backend URL
3. CORS configuration in `server/index.js` uses `process.env.CLIENT_URL`

---

## 📌 Best Practices

✅ **DO:**
- Keep different `.env` files for different machines/environments
- Update `.env` when deploying to new machines
- Never commit `.env` file to git (already in .gitignore)
- Use strong passwords for production
- Document any new environment variables you add

❌ **DON'T:**
- Edit `docker-compose.yml` to change credentials (use `.env` instead)
- Edit `config/database.js` to change DB settings (use `.env` instead)
- Share `.env` files with sensitive data
- Use default credentials in production
- Commit `.env` to version control

---

## 📚 Related Files

- [STARTUP_GUIDE.md](./STARTUP_GUIDE.md) - How to start the application
- [security-architecture.md](./security-architecture.md) - Security configuration
- [docker-compose.yml](./docker-compose.yml) - Docker configuration
- [server/env.example](./server/env.example) - Environment template

---

**Last Updated:** February 15, 2026
