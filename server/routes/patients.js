const express = require('express');
const patientController = require('../controllers/patientController');
const { authenticateToken, authorizeRoles, authorizeResourceAccess } = require('../middleware/auth');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'patient-profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Patient profile validation
const updatePatientValidation = [
  body('bloodType').optional().custom((value) => {
    if (value && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(value)) {
      throw new Error('Valid blood type is required');
    }
    return true;
  }),
  body('emergencyContact').optional().custom((value) => {
    if (value && (value.length < 2 || value.length > 100)) {
      throw new Error('Emergency contact name must be 2-100 characters');
    }
    return true;
  }),
  body('emergencyPhone').optional().custom((value) => {
    // Allow empty strings
    if (!value || value.trim() === '') {
      return true;
    }
    // Remove spaces, dashes, and parentheses for validation
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    // Allow phone numbers starting with + or 0-9, with 7-15 digits
    if (!/^[\+]?[\d]{7,15}$/.test(cleaned)) {
      throw new Error('Valid emergency phone number is required (7-15 digits)');
    }
    return true;
  }),
  body('insuranceProvider').optional().isLength({ max: 100 }).withMessage('Insurance provider name too long'),
  body('insuranceNumber').optional().isLength({ max: 50 }).withMessage('Insurance number too long')
];

// Medical record validation
const createMedicalRecordValidation = [
  body('doctorId').isInt().withMessage('Valid doctor ID is required'),
  body('recordType').isIn(['consultation', 'lab_result', 'imaging', 'prescription', 'vaccination', 'surgery']).withMessage('Valid record type is required'),
  body('title').isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').optional().isLength({ max: 2000 }).withMessage('Description too long'),
  body('diagnosis').optional().isLength({ max: 1000 }).withMessage('Diagnosis too long'),
  body('treatment').optional().isLength({ max: 1000 }).withMessage('Treatment description too long'),
  body('medications').optional().isLength({ max: 1000 }).withMessage('Medications description too long'),
  body('isPrivate').optional().isBoolean().withMessage('isPrivate must be boolean')
];

// All routes require authentication
router.use(authenticateToken);

// Patient profile routes (with ID)
router.get('/:id/profile', authorizeRoles('patient', 'doctor', 'admin'), patientController.getPatientProfile);
router.put('/:id/profile', authorizeRoles('patient', 'admin'), authorizeResourceAccess('patient'), updatePatientValidation, patientController.updatePatientProfile);

// Patient profile routes (current user)
router.get('/profile', authorizeRoles('patient'), patientController.getCurrentPatientProfile);
router.put('/profile', authorizeRoles('patient'), updatePatientValidation, patientController.updateCurrentPatientProfile);

// Image upload route
router.post('/upload-image', authorizeRoles('patient'), upload.single('profileImage'), patientController.uploadProfileImage);

// Medical records routes
router.get('/:id/medical-records', authorizeRoles('patient', 'doctor', 'admin'), patientController.getMedicalRecords);
router.post('/:id/medical-records', authorizeRoles('doctor', 'admin'), createMedicalRecordValidation, patientController.createMedicalRecord);

// Appointments routes
router.get('/:id/appointments', authorizeRoles('patient', 'doctor', 'admin'), patientController.getPatientAppointments);

// Dashboard stats route
router.get('/:id/dashboard/stats', authorizeRoles('patient', 'doctor', 'admin'), patientController.getPatientDashboardStats);

module.exports = router;
