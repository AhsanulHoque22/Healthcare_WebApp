# Quick Reference - Environment Configuration

## 🎯 Common Tasks

### Task 1: Deploy to New Machine

```bash
# 1. Copy files
scp -r healthcare-web-app user@newmachine:/home/user/

# 2. Connect
ssh user@newmachine
cd /home/user/healthcare-web-app

# 3. Update credentials
cd server
nano .env  # Update all values

# 4. Start services
cd ..
docker-compose up -d

# 5. Verify
docker-compose logs backend | head -20
```

---

### Task 2: Change Database Password

```bash
# 1. Update .env
nano server/.env
# Change: DB_PASSWORD=new_password

# 2. Restart services
docker-compose down
docker-compose up -d

# OR for local dev
npm start  # in server directory
```

---

### Task 3: Change Frontend URL

```bash
# 1. Update .env
nano server/.env
# Change: CLIENT_URL=https://new-domain.com

# 2. Restart backend (it's in the env)
docker-compose restart backend
# OR for local
npm start  # in server directory
```

---

### Task 4: Update SMTP/Email Credentials

```bash
# 1. Update .env
nano server/.env
# Change:
# SMTP_USER=new-email@gmail.com
# SMTP_PASS=new-app-password

# 2. Restart services
docker-compose restart backend
```

---

## 📋 Files to Update by Scenario

### Local Development
Only need to update:
- `server/.env`

### Docker Deployment
Only need to update:
- `server/.env`

### All files update automatically from `.env` ✅

---

## 🔐 Security Checklist

- [ ] `DB_PASSWORD` is strong (12+ characters, mixed case, numbers, symbols)
- [ ] `JWT_SECRET` is unique and long
- [ ] `SMTP_PASS` is never hardcoded (use app-specific password)
- [ ] `.env` file is in `.gitignore` (never commit it)
- [ ] `.env` file permissions are restricted: `chmod 600 server/.env`
- [ ] No credentials in environment variable names
- [ ] Production uses HTTPS not HTTP

---

## 🧪 Testing Commands

```bash
# Test environment variables load
node -e "require('dotenv').config(); console.log(process.env.DB_HOST)"

# Test database connection
npm install  # in server directory
node -e "require('dotenv').config(); require('./config/database')"

# Test Docker configuration
docker-compose config

# View container logs
docker-compose logs -f backend
docker-compose logs -f mysql
```

---

## 📁 Key Files Reference

```
healthcare-web-app/
├── server/
│   ├── .env                    ← UPDATE THIS (source of truth)
│   ├── env.example             ← Reference template
│   ├── config/
│   │   └── database.js         ← Reads from .env
│   └── index.js                ← Reads from .env
├── docker-compose.yml          ← Reads from .env
├── ENVIRONMENT_SETUP.md        ← Read this first
└── CONFIGURATION_CHANGES.md    ← Detailed changes
```

---

## 🆘 Common Issues & Solutions

### "Can't connect to database"
```bash
# Check .env has correct values
cat server/.env | grep DB_

# Test connection
node -e "require('dotenv').config(); console.log('Host:', process.env.DB_HOST, 'Port:', process.env.DB_PORT)"

# For local: ensure MySQL is running
mysql -u root -p -e "SELECT 1"
```

### "Frontend/Backend communication fails"  
```bash
# Check CLIENT_URL in .env
cat server/.env | grep CLIENT_URL

# Should match your frontend domain
# Local: http://localhost:3000
# Docker: http://localhost:3001
# Production: https://yourdomain.com
```

### "Email/SMTP not working"
```bash
# Check SMTP settings in .env
cat server/.env | grep SMTP_

# For Gmail:
# 1. Enable 2FA on Gmail
# 2. Generate App Password
# 3. Use app password in SMTP_PASS (not regular password)
```

### "JWT token errors"
```bash
# Ensure JWT_SECRET is set and same across all instances
cat server/.env | grep JWT_SECRET

# For production, should not use default
# Should be long and unique
```

---

## 📊 Environment Variable Reference

| Variable | Where Used | Local Value | Docker Value |
|----------|-----------|------------|--------------|
| `DB_HOST` | Database connection | `localhost` | `mysql` |
| `DB_PORT` | Database connection | `3306` | `3306` |
| `DB_NAME` | Database selection | `healthcare_db` | `healthcare_db` |
| `DB_USER` | Database login | `root` | `healthcare_user` |
| `DB_PASSWORD` | Database password | `your_pwd` | `your_pwd` |
| `CLIENT_URL` | CORS, emails, frontend | `http://localhost:3000` | `http://localhost:3001` |
| `JWT_SECRET` | Token signing | Random unique string | Random unique string |
| `SMTP_HOST` | Email sending | `smtp.gmail.com` | `smtp.gmail.com` |
| `SMTP_USER` | Email account | `your-email@gmail.com` | `your-email@gmail.com` |
| `SMTP_PASS` | Email password | `app-password` | `app-password` |

---

## 🚀 One-Liner Commands

```bash
# View current configuration
cd server && node -e "require('dotenv').config(); Object.entries(process.env).filter(([k])=>k.startsWith('DB_')||k.startsWith('JWT_')||k==='CLIENT_URL').forEach(([k,v])=>console.log(k+'='+(k.includes('PASSWORD')||k.includes('SECRET')?'***':v)))"

# Start Docker (from project root)
docker-compose up -d

# Stop Docker
docker-compose down

# View logs (from project root)
docker-compose logs backend -f

# Check if services are running
docker-compose ps

# Restart just the backend
docker-compose restart backend
```

---

## 📞 Support

For detailed information, see:
- `ENVIRONMENT_SETUP.md` - Complete setup guide
- `CONFIGURATION_CHANGES.md` - What was changed
- `server/env.example` - Configuration template

---

**Quick Links:**
- Local Development: DB_HOST=localhost
- Docker: DB_HOST=mysql  
- Production: Use strong credentials, HTTPS URLs
- Never commit .env to git

---

Generated: February 15, 2026
