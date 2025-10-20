const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// Appointment validation
const createAppointmentValidation = [
  body('patientId').isInt().withMessage('Valid patient ID is required'),
  body('doctorId').isInt().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('timeBlock').isIn(['09:00-12:00', '14:00-17:00', '19:00-22:00', 'custom']).withMessage('Valid time block is required'),
  body('duration').optional().isInt({ min: 60, max: 240 }).withMessage('Duration must be 60-240 minutes for chamber appointments'),
  body('type').optional().isIn(['in_person', 'telemedicine', 'follow_up']).withMessage('Valid appointment type is required'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason too long'),
  body('symptoms').optional().isLength({ max: 1000 }).withMessage('Symptoms description too long')
];

const rescheduleAppointmentValidation = [
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid appointment time is required'),
  body('duration').optional().isInt({ min: 15, max: 120 }).withMessage('Duration must be 15-120 minutes')
];

const rescheduleRequestedValidation = [
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('timeBlock').isIn(['09:00-12:00', '14:00-17:00', '19:00-22:00', 'custom']).withMessage('Valid time block is required')
];

// All routes require authentication
router.use(authenticateToken);

// Appointment routes
router.post('/', authorizeRoles('patient', 'admin'), createAppointmentValidation, appointmentController.createAppointment);
router.get('/', authorizeRoles('patient', 'doctor', 'admin'), appointmentController.getAppointments);
router.get('/:id', authorizeRoles('patient', 'doctor', 'admin'), appointmentController.getAppointment);
router.put('/:id/cancel', authorizeRoles('patient', 'doctor', 'admin'), appointmentController.cancelAppointment);
router.put('/:id/reschedule', authorizeRoles('patient', 'doctor', 'admin'), rescheduleAppointmentValidation, appointmentController.rescheduleAppointment);

// Doctor-specific appointment management routes
router.put('/:id/approve', authorizeRoles('doctor', 'admin'), appointmentController.approveAppointment);
router.put('/:id/decline', authorizeRoles('doctor', 'admin'), appointmentController.declineAppointment);
router.put('/:id/reschedule-requested', authorizeRoles('doctor', 'admin'), rescheduleRequestedValidation, appointmentController.rescheduleRequestedAppointment);
router.put('/:id/start', authorizeRoles('doctor', 'admin'), appointmentController.startAppointment);
router.put('/:id/complete', authorizeRoles('doctor', 'admin'), appointmentController.completeAppointment);

module.exports = router;
