const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const patientRoutes = require('./routes/patients');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const adminRoutes = require('./routes/admin');
const prescriptionRoutes = require('./routes/prescriptions');
const ratingRoutes = require('./routes/ratings');
const labTestRoutes = require('./routes/labTests');
const bkashRoutes = require('./routes/bkash');
const medicineRoutes = require('./routes/medicine');
const notificationRoutes = require('./routes/notifications');
const websiteReviewRoutes = require('./routes/websiteReviews');
const errorHandler = require('./middleware/errorHandler');
const { setupVoiceToPrescription } = require('./services/voiceService');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directories exist
const uploadDirs = [
  'uploads',
  'uploads/lab-results',
  'uploads/prescriptions',
  'uploads/doctor-profiles',
  'uploads/patient-profiles'
];

uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created directory: ${fullPath}`);
  }
});

// Trust the proxy (Railway) for accurate IP-based rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});



// CORS configuration
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => {
    const trimmed = origin.trim();
    const cleaned = trimmed.replace(/\/+$/, '');
    if (process.env.NODE_ENV === 'production') {
      console.log(`[CORS-PREP] Original: "${trimmed}", Cleaned: "${cleaned}"`);
    }
    return cleaned;
  })
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Log the incoming origin for debugging
    if (process.env.NODE_ENV === 'production') {
      console.log(`[CORS] Incoming origin: ${origin || 'no-origin'}`);
      console.log(`[CORS] Allowed origins: [${allowedOrigins.join(', ')}]`);
    }

    // Allow same-origin server-to-server and health checks with no origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);

    // Normalize both incoming origin and allowed origins for comparison
    const normalizedOrigin = origin.replace(/\/+$/, '');
    const isAllowed = allowedOrigins.some(allowed => allowed === normalizedOrigin);

    if (isAllowed) {
      if (process.env.NODE_ENV === 'production') console.log(`[CORS] SUCCESS: Origin ${origin} allowed.`);
      return callback(null, true);
    }
    
    const corsError = new Error(`CORS origin ${origin} not allowed. Please check your Railway CLIENT_URL variable.`);
    if (process.env.NODE_ENV === 'production') console.error(`[CORS] ERROR: ${corsError.message}`);
    return callback(corsError);
  },
  credentials: true
}));

// app.use('/api/', limiter);
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Allow-Origin', '*');
  next();
}, express.static('uploads'));

// Logging middleware
app.use(morgan('combined'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/lab-tests', labTestRoutes);
app.use('/api/bkash', bkashRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/website-reviews', websiteReviewRoutes);

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.status(200).send('Livora API is Running');
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const connectWithRetry = async () => {
  let retries = 10;

  while (retries) {
    try {
      await sequelize.authenticate();
      console.log('Database connection established successfully.');
      return;
    } catch (err) {
      console.log(`Database not ready (Retries left: ${retries - 1}). Error: ${err.message}`);
      retries -= 1;
      if (retries === 0) break;
      await new Promise(res => setTimeout(res, 2000)); // Reduced to 2s
    }
  }

  console.error('Unable to connect to database after multiple attempts.');
};

// Database connection and server start
const startServer = async () => {
  try {
    await connectWithRetry();
    
    // Sync database models
    // if (process.env.NODE_ENV !== "production") {
    //   await sequelize.sync({ force: false, alter: false });
    //   console.log("Development DB sync complete.");
    // }
    
    // Never auto-sync schema in production.
    // Use Sequelize migrations instead.
    // Sync database models
    const shouldSync = process.env.NODE_ENV !== 'production' || 
                      (process.env.DB_SYNC && process.env.DB_SYNC.toLowerCase() === 'true');
    
    if (process.env.NODE_ENV === 'production') {
      console.log(`[Database] DB_SYNC variable is: "${process.env.DB_SYNC}"`);
      console.log(`[Database] Should sync: ${shouldSync}`);
    }

    if (shouldSync) {
      console.log('[Database] Starting synchronization...');
      await sequelize.sync({ force: false, alter: false });
      
      console.log('[Database] Synchronization complete.');
    }
    
    // Note: Temporary logic to deploy chamber structures to Railway
    if (process.env.NODE_ENV === 'production') {
      console.log('[Database] Running explicit missing table alterations for chambers update...');
      try {
        await sequelize.query("ALTER TABLE doctors ADD COLUMN chambers JSON;");
        console.log("Successfully added chambers to doctors");
      } catch(e) {
         if(e.message && e.message.includes("Duplicate column name")) {
             console.log("Column chambers already exists");
         } else {
             console.error("Error adding chambers:", e.message);
         }
      }

      try {
        await sequelize.query("ALTER TABLE appointments ADD COLUMN chamber VARCHAR(255);");
        console.log("Successfully added chamber to appointments");
      } catch(e) {
         if(e.message && e.message.includes("Duplicate column name")) {
             console.log("Column chamber already exists");
         } else {
             console.error("Error adding chamber:", e.message);
         }
      }
    } else {
      try {
        const models = require('./models');
        const tablesToSync = ['User', 'Patient', 'Doctor', 'WebsiteReview', 'Appointment', 'LabTestOrder', 'Medicine', 'MedicineReminder', 'MedicineDosage', 'Prescription', 'MedicineLog'];
        
        for (const name of tablesToSync) {
          if (models[name]) {
            await models[name].sync({ alter: true });
            console.log(`[Database] ${name} schema verified/altered successfully.`);
          }
        }
      } catch (err) {
        console.error('[Database] Dev-mode sync failure:', err.message);
      }
    }
    
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      try {
        const { startDailyReminderScheduler } = require('./jobs/dailyAppointmentReminder');
        startDailyReminderScheduler();
      } catch (err) {
        console.warn('[Server] Daily reminder scheduler could not start:', err.message);
      }
      try {
        const { startMedicineReminderJob } = require('./jobs/medicineReminderJob');
        startMedicineReminderJob();
        console.log('[Server] Medicine reminder job started');
      } catch (err) {
        console.warn('[Server] Medicine reminder job could not start:', err.message);
      }

      // Voice-to-Prescription WebSocket setup
      try {
        setupVoiceToPrescription(server);
        console.log('[Server] Voice-to-Prescription WebSocket service initialized');
      } catch (err) {
        console.error('[Server] Failed to initialize voice service:', err.message);
      }
    });

    // Handle server errors gracefully
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use...`);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

console.log("🚀 startServer called");
startServer();

module.exports = app;
