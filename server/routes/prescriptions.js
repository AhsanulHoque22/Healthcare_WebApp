const express = require('express');
const prescriptionController = require('../controllers/prescriptionController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// Prescription validation
const prescriptionValidation = [
  body('appointmentId').isInt().withMessage('Valid appointment ID is required'),
  body('medicines').optional().isLength({ max: 2000 }).withMessage('Medicines description too long'),
  body('symptoms').optional().isLength({ max: 2000 }).withMessage('Symptoms description too long'),
  body('diagnosis').optional().isLength({ max: 2000 }).withMessage('Diagnosis description too long'),
  body('suggestions').optional().isLength({ max: 2000 }).withMessage('Suggestions description too long'),
  body('tests').optional().isLength({ max: 2000 }).withMessage('Tests description too long')
];

// All routes require authentication
router.use(authenticateToken);

// Get prescription by appointment ID
router.get('/appointment/:appointmentId', 
  authorizeRoles('doctor', 'patient', 'admin'), 
  prescriptionController.getPrescriptionByAppointment
);

// Create or update prescription (Doctor only)
router.post('/appointment/:appointmentId', 
  authorizeRoles('doctor'), 
  prescriptionValidation, 
  prescriptionController.createOrUpdatePrescription
);

// Complete prescription (Doctor only)
router.put('/appointment/:appointmentId/complete', 
  authorizeRoles('doctor'), 
  prescriptionController.completePrescription
);

// Upload test reports (Admin only)
router.post('/appointment/:appointmentId/test-reports', 
  authorizeRoles('admin'), 
  prescriptionController.upload.array('testReports', 5),
  prescriptionController.uploadTestReports
);

// Get test reports
router.get('/appointment/:appointmentId/test-reports', 
  authorizeRoles('doctor', 'patient', 'admin'), 
  prescriptionController.getTestReports
);

// Download test report
router.get('/appointment/:appointmentId/test-reports/:filename', 
  authorizeRoles('doctor', 'patient', 'admin'), 
  prescriptionController.downloadTestReport
);

module.exports = router;
