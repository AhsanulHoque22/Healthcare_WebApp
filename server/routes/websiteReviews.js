const express = require('express');
const websiteReviewController = require('../controllers/websiteReviewController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// Validation
const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').isLength({ min: 10, max: 1000 }).withMessage('Review must be between 10 and 1000 characters')
];

// Public routes
router.get('/public', websiteReviewController.getPublicReviews);

// Protected routes
router.use(authenticateToken);

// Create or update review
router.post('/', reviewValidation, websiteReviewController.createReview);

// Admin routes
router.get('/all', authorizeRoles('admin'), websiteReviewController.getAllReviews);

module.exports = router;
