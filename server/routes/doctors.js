const express = require('express');
const multer = require('multer');
const path = require('path');
const doctorController = require('../controllers/doctorController');
const { authenticateToken, authorizeRoles, authorizeResourceAccess } = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doctor-profile-' + uniqueSuffix + path.extname(file.originalname));
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

// Doctor profile validation
const updateDoctorValidation = [
  body('bmdcRegistrationNumber').optional().isLength({ min: 5, max: 50 }).withMessage('BMDC Registration Number must be 5-50 characters'),
  body('specialization').optional().isLength({ min: 2, max: 100 }).withMessage('Specialization must be 2-100 characters'),
  body('experience').optional().isInt({ min: 0, max: 50 }).withMessage('Experience must be 0-50 years'),
  body('education').optional().isLength({ max: 1000 }).withMessage('Education description too long'),
  body('certifications').optional().isLength({ max: 1000 }).withMessage('Certifications description too long'),
  body('consultationFee').optional().custom((value) => {
    if (!value || value === '') return true; // Allow empty values
    if (isNaN(value) || parseFloat(value) < 0) {
      throw new Error('Consultation fee must be a valid positive number');
    }
    return true;
  }),
  body('bio').optional().isLength({ max: 2000 }).withMessage('Bio too long'),
  body('hospital').optional().isLength({ max: 200 }).withMessage('Hospital name too long'),
  body('location').optional().isLength({ max: 300 }).withMessage('Location too long'),
  body('degrees').optional().isArray().withMessage('Degrees must be an array'),
  body('awards').optional().isArray().withMessage('Awards must be an array'),
  body('chamberTimes').optional().isObject().withMessage('Chamber times must be an object'),
  body('languages').optional().isArray().withMessage('Languages must be an array'),
  body('services').optional().isArray().withMessage('Services must be an array'),
  body('profileImage').optional().custom((value) => {
    if (!value) return true; // Allow empty values
    // Allow URLs, base64 data URLs, and relative paths
    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image/') || value.startsWith('/uploads/'))) {
      return true;
    }
    throw new Error('Profile image must be a valid URL, base64 data URL, or upload path');
  })
];

// Appointment update validation
const updateAppointmentValidation = [
  body('status').isIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).withMessage('Valid status is required'),
  body('notes').optional().isLength({ max: 2000 }).withMessage('Notes too long'),
  body('diagnosis').optional().isLength({ max: 1000 }).withMessage('Diagnosis too long'),
  body('prescription').optional().isLength({ max: 1000 }).withMessage('Prescription too long'),
  body('followUpDate').optional().isISO8601().withMessage('Valid follow-up date is required')
];

// Public route to get all doctors (for patients to browse)
router.get('/', doctorController.getAllDoctors);

// All other routes require authentication
router.use(authenticateToken);

// Doctor profile routes (with ID)
router.get('/:id/profile', authorizeRoles('doctor', 'admin'), doctorController.getDoctorProfile);
router.put('/:id/profile', authorizeRoles('doctor', 'admin'), authorizeResourceAccess('doctor'), updateDoctorValidation, doctorController.updateDoctorProfile);

// Doctor profile routes (current user)
router.get('/profile', authorizeRoles('doctor'), doctorController.getCurrentDoctorProfile);
router.put('/profile', authorizeRoles('doctor'), updateDoctorValidation, doctorController.updateCurrentDoctorProfile);

// Image upload route
router.post('/upload-image', authorizeRoles('doctor'), upload.single('profileImage'), doctorController.uploadProfileImage);

// Doctor dashboard routes
router.get('/:id/dashboard/stats', authorizeRoles('doctor', 'admin'), doctorController.getDoctorDashboardStats);
router.get('/:id/appointments', authorizeRoles('doctor', 'admin'), doctorController.getDoctorAppointments);
router.get('/:id/patients', authorizeRoles('doctor', 'admin'), doctorController.getDoctorPatients);

// Appointment management routes
router.put('/appointments/:appointmentId', authorizeRoles('doctor', 'admin'), updateAppointmentValidation, doctorController.updateAppointmentStatus);

module.exports = router;
