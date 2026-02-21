# 🏥 Healthcare Web App - Complete Deployment Guide

A comprehensive healthcare management system with patient appointments, doctor consultations, lab tests, prescriptions, and more. Production-ready with Docker deployment.

---

## 📋 Table of Contents
- [Quick Overview](#-quick-overview)
- [System Requirements](#-system-requirements)
- [Step-by-Step Deployment](#-step-by-step-deployment)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Troubleshooting](#-troubleshooting)
- [Documentation](#-documentation)
- [Support](#-support)

---

## 🎯 Quick Overview

**What does this app do?**
- 👨‍⚕️ Doctor & Patient Management
- 📅 Appointment Scheduling
- 🩺 Lab Tests & Results
- 💊 Prescription Management
- 🔔 Medicine Reminders
- 💳 Payment Processing (bKash)
- 📹 Video Consultations
- 📧 Email Notifications
- 🔐 Secure Authentication

**Tech Stack:**
- **Frontend:** React with TypeScript, Tailwind CSS
- **Backend:** Express.js with Node.js
- **Database:** MySQL 8.0 with Sequelize ORM
- **Deployment:** Docker & Docker Compose
- **Authentication:** JWT Tokens

---

## 💻 System Requirements

Before you start, ensure you have:

| Requirement | Version | Purpose |
|------------|---------|---------|
| **Docker** | 20.10+ | Container runtime |
| **Docker Compose** | 1.29+ | Multi-container orchestration |
| **Git** | Any version | Clone repository |
| **RAM** | 4GB minimum | Running containers |
| **Disk Space** | 5GB minimum | Code + containers + data |

### ✅ Check Your System

```bash
# Check Docker installation
docker --version
docker-compose --version

# If not installed, visit:
# - Docker: https://docs.docker.com/get-docker/
# - Docker Compose: https://docs.docker.com/compose/install/
```

---

## 🚀 Step-by-Step Deployment

### **STEP 1: Clone the Repository**

```bash
# Clone the project
git clone <your-repo-url>
cd healthcare-web-app

# Verify the structure
ls -la
# You should see: client/, server/, docker-compose.yml, etc.
```

---

### **STEP 2: Configure Environment Variables**

The application uses ONE configuration file for all credentials:

#### **2a: Copy the template**

```bash
cd server
cp env.example .env
cd ..
```

#### **2b: Edit `.env` with your credentials**

```bash
# Open server/.env in your text editor
nano server/.env
# or
vim server/.env
```

#### **2c: Update with your values**

```env
# ============================================================
# DATABASE CONFIGURATION
# For LOCAL development: DB_HOST=localhost
# For DOCKER deployment: DB_HOST=mysql (service name)
# ============================================================
DB_HOST=mysql
DB_PORT=3306
DB_NAME=healthcare_db
DB_USER=root
DB_PASSWORD=healthcare123        # CHANGE THIS!

# ============================================================
# JWT AUTHENTICATION
# ============================================================
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=7d

# ============================================================
# FRONTEND URL (for CORS and redirects)
# For LOCAL: http://localhost:3000
# For DOCKER: http://localhost:3001 or your domain
# For PRODUCTION: https://yourdomain.com
# ============================================================
CLIENT_URL=http://localhost:3001

# ============================================================
# EMAIL CONFIGURATION (for password reset notifications)
# Get App Password from Gmail: https://myaccount.google.com/apppasswords
# ============================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
FROM_EMAIL=noreply@healthcare.com

# ============================================================
# OTHER CONFIGURATIONS
# ============================================================
NODE_ENV=production
PORT=5000
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ Important:** 
- Never commit `.env` file (it's in `.gitignore`)
- Change `DB_PASSWORD` and `JWT_SECRET` in production
- Use real email credentials for notifications

---

### **STEP 3: Start the Application with Docker**

#### **3a: Build and run containers**

```bash
# Make sure you're in the project root directory
pwd  # Should show: /path/to/healthcare-web-app

# Start all services (MySQL, Backend, Frontend, Redis)
docker-compose up -d

# This will:
# ✅ Create MySQL database
# ✅ Build backend image
# ✅ Build frontend image
# ✅ Start all services
```

#### **3b: Wait for initialization**

```bash
# Check if services are running
docker-compose ps

# Wait 10-15 seconds for database initialization
sleep 15

# View logs (if needed)
docker-compose logs -f backend
```

#### **3c: Access the application**

Once all containers are running:
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:5000/api
- **Database:** localhost:3306 (MySQL)

---

### **STEP 4: Database Initialization (First Time Only)**

If this is your first deployment, the database will auto-initialize. To verify:

```bash
# Check if migrations ran successfully
docker-compose logs backend | grep -i "migration"

# If you see errors, run migrations manually:
docker-compose exec backend npm run migrate
```

---

## 🔧 Configuration

All configuration is managed through **`server/.env`**

### **Change Database Credentials**

Edit `server/.env`:
```env
DB_HOST=mysql          # Don't change if using Docker
DB_PORT=3306           # Don't change if using Docker
DB_NAME=healthcare_db  # Can be changed
DB_USER=root           # MySQL user
DB_PASSWORD=***        # CHANGE THIS ← YOUR PASSWORD
```

Then restart:
```bash
docker-compose restart mysql backend
```

### **Change Frontend URL (Important!)**

```env
# If running locally
CLIENT_URL=http://localhost:3001

# If running on server
CLIENT_URL=http://your-server-ip:3001

# If running on domain with HTTPS
CLIENT_URL=https://yourdomain.com
```

Then restart:
```bash
docker-compose restart backend frontend
```

### **Change Email Configuration**

For Gmail:
1. Enable 2-Factor Authentication: https://myaccount.google.com/security
2. Get App Password: https://myaccount.google.com/apppasswords
3. Update `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password-from-step-2
FROM_EMAIL=your-email@gmail.com
```

---

## 🎮 Running the Application

### **Start Services**
```bash
docker-compose up -d
```

### **Stop Services**
```bash
docker-compose down
```

### **View Logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### **Rebuild After Code Changes**
```bash
docker-compose down
docker-compose up -d --build
```

### **Access Services**
| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:3001 | 3001 |
| Backend API | http://localhost:5000 | 5000 |
| MySQL | localhost | 3306 |
| Redis | localhost | 6379 |

---

## 📝 Test Credentials

### **Admin Account** (Pre-seeded)
```
Email: admin@healthcare.com
Password: password123
```

### **Doctor Account** (Pre-seeded)
```
Email: doctor@healthcare.com
Password: password123
```

### **Patient Account** (Pre-seeded)
```
Email: patient@healthcare.com
Password: password123
```

After login, you can change passwords from the profile settings.

---

## 🧪 Verification Checklist

After deployment, verify everything works:

```bash
# ✅ Check if all containers are running
docker-compose ps

# ✅ Check backend logs for errors
docker-compose logs backend | tail -20

# ✅ Test API endpoint
curl http://localhost:5000/api/health

# ✅ Check database connection
docker-compose exec mysql mysql -u root -phealth care123 -e "SHOW DATABASES;"

# ✅ Access frontend
# Open browser → http://localhost:3001
# Login with admin@healthcare.com / password123
```

---

## ❌ Troubleshooting

### **Problem: "Cannot connect to Docker daemon"**
```bash
# Solution: Start Docker service
sudo systemctl start docker

# Or on Mac, open Docker Desktop
```

### **Problem: "Port 3001 already in use"**
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### **Problem: "Database connection failed"**
```bash
# Check if MySQL is running
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

### **Problem: "Node modules not installed"**
```bash
# Rebuild containers
docker-compose down
docker-compose up -d --build
```

### **Problem: "Migrations not running"**
```bash
# Check if backend is running
docker-compose logs backend

# Manually run migrations
docker-compose exec backend npm run migrate

# Check database
docker-compose exec mysql mysql -u root -phealth care123 healthcare_db -e "SHOW TABLES;"
```

### **Problem: "Can't login to application"**
```bash
# Check if seed data was created
docker-compose exec backend npm run seed

# Restart backend
docker-compose restart backend

# Check backend logs
docker-compose logs backend
```

---

## 📚 Documentation

All detailed documentation is in the `Documentations/` folder:

| Document | Purpose |
|----------|---------|
| [CONFIG_INDEX.md](Documentations/CONFIG_INDEX.md) | Configuration navigation guide |
| [ENVIRONMENT_SETUP.md](Documentations/ENVIRONMENT_SETUP.md) | Detailed environment setup |
| [api-specification.md](Documentations/api-specification.md) | Complete API reference |
| [database-schema.md](Documentations/database-schema.md) | Database structure |
| [security-architecture.md](Documentations/security-architecture.md) | Security implementation |
| [QUICK_REFERENCE.md](Documentations/QUICK_REFERENCE.md) | Common commands |

---

## 📊 Project Structure

```
healthcare-web-app/
├── client/                      # React Frontend
│   ├── public/                 # Static files
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   └── App.tsx             # Main app
│   ├── Dockerfile              # Frontend container
│   └── tailwind.config.js       # Styling config
│
├── server/                      # Express Backend
│   ├── config/                 # Configuration files
│   ├── controllers/            # Business logic
│   ├── models/                 # Database models
│   ├── routes/                 # API routes
│   ├── migrations/             # Database migrations
│   ├── seeders/                # Initial data
│   ├── .env                    # Environment variables ⭐
│   ├── env.example             # Template
│   ├── Dockerfile              # Backend container
│   └── index.js                # Entry point
│
├── docker-compose.yml          # Container orchestration
├── README.md                   # This file
└── Documentations/             # Detailed documentation
    ├── ENVIRONMENT_SETUP.md    # Setup guide
    ├── api-specification.md    # API docs
    └── ... (other docs)
```

---

## 🔐 Security Notes

- ✅ Passwords are hashed with bcrypt
- ✅ JWTs expire after 7 days
- ✅ API rate limiting enabled
- ✅ CORS configured for specified origins
- ✅ SQL injection prevention (ORM usage)
- ✅ Environment variables for secrets (no hardcoding)

**For Production:**
- Change all default passwords
- Use HTTPS (SSL/TLS certificate)
- Set strong `JWT_SECRET`
- Enable firewall rules
- Regular backups
- Monitor logs

---

## 🆘 Getting Help

1. **Check logs first:**
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

2. **Read documentation:**
   - See `Documentations/QUICK_REFERENCE.md` for common commands
   - See `Documentations/ENVIRONMENT_SETUP.md` for detailed setup

3. **Common issues guide:**
   - See [Troubleshooting](#-troubleshooting) section above

4. **API Documentation:**
   - See `Documentations/api-specification.md`

---

## 📝 Quick Commands Reference

```bash
# START everything
docker-compose up -d

# STOP everything
docker-compose down

# VIEW STATUS
docker-compose ps

# VIEW LOGS
docker-compose logs -f

# ACCESS BACKEND SHELL
docker-compose exec backend bash

# ACCESS MYSQL SHELL
docker-compose exec mysql mysql -u root -phealth care123

# REBUILD after code changes
docker-compose up -d --build

# RESET database (WARNING: deletes all data!)
docker volume rm healthcare-web-app_mysql_data
docker-compose up -d
```

---

## ✨ Features

- ✅ Patient & Doctor Management
- ✅ Appointment Scheduling with Calendar
- ✅ Lab Tests Management
- ✅ Digital Prescriptions (PDF Export)
- ✅ Medicine Reminders
- ✅ Video Consultations
- ✅ Payment Gateway (bKash)
- ✅ Email Notifications
- ✅ Admin Dashboard
- ✅ Role-Based Access Control
- ✅ Real-time Status Updates
- ✅ Responsive Design (Mobile/Desktop)

---

## 📄 License

This project is private and proprietary.

---

## 🎉 You're Ready!

Your healthcare web application is now deployed and ready to use!

1. ✅ Access frontend: **http://localhost:3001**
2. ✅ Login with: **admin@healthcare.com** / **password123**
3. ✅ Explore the dashboard and features
4. ✅ Change settings in `server/.env` as needed

**Happy Healthcare! 🏥**

---

*Last Updated: February 2026*
*Version: 2.0 - Production Ready*
