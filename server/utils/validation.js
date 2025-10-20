const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('lastName').notEmpty().trim().withMessage('Last name is required'),
  body('phone').optional().custom((value) => {
    // Allow empty strings or null values
    if (!value || value.trim() === '') {
      return true;
    }
    // Basic phone validation - allow various formats
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
    if (!phoneRegex.test(value)) {
      throw new Error('Valid phone number is required');
    }
    return true;
  }),
  body('dateOfBirth').optional().custom((value) => {
    // Allow empty strings or null values
    if (!value || value.trim() === '') {
      return true;
    }
    // Check if it's a valid date
    if (!new Date(value).getTime()) {
      throw new Error('Valid date is required');
    }
    return true;
  }),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  body('role').optional().isIn(['patient', 'doctor', 'admin']).withMessage('Valid role is required')
];

const loginValidation = [
  body('password').notEmpty().withMessage('Password is required'),
  body().custom((value, { req }) => {
    const { email, phone } = req.body;
    
    if (!email && !phone) {
      throw new Error('Either email or phone number is required');
    }
    
    if (email && phone) {
      throw new Error('Please provide either email or phone number, not both');
    }
    
    // Validate email format if provided
    if (email) {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(email)) {
        throw new Error('Valid email is required');
      }
    }
    
    // Validate phone format if provided
    if (phone) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(phone)) {
        throw new Error('Valid phone number is required');
      }
    }
    
    return true;
  })
];

const updateProfileValidation = [
  body('firstName').optional().notEmpty().trim().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().trim().withMessage('Last name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date is required'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Valid gender is required')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
};