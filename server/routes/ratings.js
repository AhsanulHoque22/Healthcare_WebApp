const express = require('express');
const ratingController = require('../controllers/ratingController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// Rating validation
const createRatingValidation = [
  body('appointmentId').isInt().withMessage('Valid appointment ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isLength({ max: 1000 }).withMessage('Review must be less than 1000 characters'),
  body('feedback').optional().isLength({ max: 1000 }).withMessage('Feedback must be less than 1000 characters'),
  body('isAnonymous').optional().isBoolean().withMessage('isAnonymous must be boolean')
];

// All routes require authentication
router.use(authenticateToken);

// Patient routes
router.post('/', 
  authorizeRoles('patient'), 
  createRatingValidation, 
  ratingController.createRating
);

router.get('/my-ratings', 
  authorizeRoles('patient'), 
  ratingController.getPatientRatings
);

// Public doctor rating routes (approved ratings only)
router.get('/doctor/:doctorId', 
  ratingController.getDoctorRatings
);

// Admin routes
router.get('/admin/all', 
  authorizeRoles('admin'), 
  ratingController.getAllRatings
);

router.get('/admin/stats', 
  authorizeRoles('admin'), 
  ratingController.getRatingStats
);

router.put('/admin/:ratingId/status', 
  authorizeRoles('admin'),
  [
    body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Status must be pending, approved, or rejected')
  ],
  ratingController.updateRatingStatus
);

module.exports = router;
