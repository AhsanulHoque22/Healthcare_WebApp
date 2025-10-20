const express = require('express');
const adminController = require('../controllers/adminController');
const labTestController = require('../controllers/labTestController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for multiple file uploads (prescription lab tests)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/lab-results/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'prescription-result-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMultiple = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Support medical reports and imaging files
    const allowedTypes = /pdf|jpg|jpeg|png|gif|bmp|tiff|tif|dcm|dicom|nii|nifti|mhd|raw|img|hdr|vti|vtp|stl|obj|ply|xyz|txt|csv|xlsx|xls|doc|docx|rtf|odt|ods|odp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype || '';
    
    // Allow common medical file types and documents
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff', 'image/tif',
      'application/dicom', 'application/x-dicom', 'application/octet-stream', // DICOM files
      'application/zip', 'application/x-zip-compressed', // Compressed medical files
      'text/plain', 'text/csv',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/rtf', 'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet', 'application/vnd.oasis.opendocument.presentation'
    ];
    
    const isValidMimeType = allowedMimeTypes.some(type => mimetype.includes(type));
    
    if ((mimetype && isValidMimeType) || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only medical reports and imaging files are allowed (PDF, images, DICOM, documents, etc.)'));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit for medical imaging files
});

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// User management routes
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// System statistics routes
router.get('/stats', adminController.getSystemStats);
router.get('/analytics/appointments', adminController.getAppointmentAnalytics);

// Doctor management routes (for admin use)
router.get('/doctors', adminController.getAllDoctors);
router.get('/doctor-verifications', adminController.getDoctorVerificationRequests);
router.put('/doctors/:id/verify', adminController.verifyDoctor);

// Patient management routes (for admin use)
router.get('/patients', adminController.getPatients);
router.get('/patients/:id', adminController.getPatientById);
router.put('/patients/:id/status', adminController.updateUserStatus);

// Lab test management routes (for admin use)
router.get('/lab-orders', labTestController.getAllLabOrders);
router.put('/lab-orders/:orderId/status', labTestController.updateOrderStatus);
router.post('/lab-orders/:orderId/offline-payment', labTestController.processOfflinePayment);
router.post('/lab-orders/:orderId/upload-results', uploadMultiple.array('files', 10), labTestController.uploadLabResults);
router.delete('/lab-orders/:orderId/reports/:reportIndex', labTestController.removeLabOrderReport);
router.post('/lab-orders/:orderId/confirm-reports', labTestController.confirmLabOrderReports);
router.post('/lab-orders/:orderId/revert-reports', labTestController.revertLabOrderReports);

// Prescription lab tests routes (for admin use)
router.get('/prescription-lab-tests', labTestController.getAllPrescriptionLabTests);
router.post('/prescription-lab-tests/:testId/approve', labTestController.approvePrescriptionLabTest);
router.put('/prescription-lab-tests/:testId/status', labTestController.updatePrescriptionLabTestStatus);
router.post('/prescription-lab-tests/:testId/upload-results', uploadMultiple.array('files', 10), labTestController.uploadPrescriptionLabResults);
router.post('/prescription-lab-tests/:testId/payment', labTestController.processPrescriptionLabPayment);
router.delete('/prescription-lab-tests/:testId/reports/:reportIndex', labTestController.removePrescriptionLabTestReport);
router.post('/prescription-lab-tests/:testId/confirm-reports', labTestController.confirmPrescriptionLabTestReports);
router.post('/prescription-lab-tests/:testId/revert-reports', labTestController.revertPrescriptionLabTestReports);

// Payment processing routes
router.post('/process-payment', labTestController.processPayment);
router.put('/tests/:testId/sample-processing', labTestController.updateToSampleProcessing);
router.put('/tests/:testId/sample-taken', labTestController.updateToSampleTaken);

// Cash payment routes
router.post('/lab-orders/cash-payment', labTestController.recordCashPaymentForOrder);
router.post('/prescription-tests/cash-payment', labTestController.recordCashPaymentForPrescription);

// Lab test management routes (for admin use)
router.get('/lab-tests', labTestController.getAllLabTestsForAdmin);
router.post('/lab-tests', labTestController.createLabTest);
router.put('/lab-tests/:testId', labTestController.updateLabTest);
router.delete('/lab-tests/:testId', labTestController.deleteLabTest);

module.exports = router;
