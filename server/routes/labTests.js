const express = require('express');
const router = express.Router();
const labTestController = require('../controllers/labTestController');
const { getPatientPrescriptionLabTestsOptimized } = require('../controllers/optimizedLabTestController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
const createOrderValidation = [
  body('testIds')
    .isArray({ min: 1 })
    .withMessage('At least one test must be selected'),
  body('testIds.*')
    .isInt({ min: 1 })
    .withMessage('Invalid test ID')
];

const paymentValidation = [
  body('paymentMethod')
    .isIn(['bkash', 'bank_transfer', 'offline_cash', 'offline_card'])
    .withMessage('Invalid payment method'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Invalid payment amount')
];

// Public routes
router.get('/tests', labTestController.getAllLabTests);
router.get('/categories', labTestController.getLabTestCategories);

// Patient routes (protected)
router.post('/orders', authenticateToken, createOrderValidation, labTestController.createLabTestOrder);
router.get('/orders', authenticateToken, labTestController.getPatientLabOrders);
router.post('/orders/:orderId/payment', authenticateToken, paymentValidation, labTestController.makePayment);

// Prescription lab tests routes - using regular version for now
router.get('/prescription-tests', authenticateToken, labTestController.getPatientPrescriptionLabTests);
router.post('/prescription-tests/:testId/payment', authenticateToken, paymentValidation, labTestController.processPrescriptionLabPayment);

// Doctor routes - get patient lab reports
router.get('/patients/:patientId/lab-reports', authenticateToken, labTestController.getPatientLabReportsForDoctor);
router.get('/patients/:patientId/prescription-lab-tests', authenticateToken, labTestController.getPatientPrescriptionLabTestsForDoctor);

module.exports = router;
