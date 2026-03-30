const { WebsiteReview, User } = require('../models');
const { validationResult } = require('express-validator');

// Get all approved website reviews
const getPublicReviews = async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;

    const reviews = await WebsiteReview.findAll({
      where: { status: 'approved' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'profileImage', 'role']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: { reviews }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new website review
const createReview = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { rating, review } = req.body;
    const userId = req.user.id;

    // Check if user already submitted a review
    const existingReview = await WebsiteReview.findOne({
      where: { userId }
    });

    if (existingReview) {
      // Update the existing review if it exists
      await existingReview.update({
        rating,
        review,
        status: 'approved' // Automatically approve
      });

      return res.json({
        success: true,
        message: 'Review updated successfully',
        data: { review: existingReview }
      });
    }

    // Create the review
    const newReview = await WebsiteReview.create({
      userId,
      rating,
      review,
      status: 'approved'
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: { review: newReview }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all reviews
const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const reviews = await WebsiteReview.findAndCountAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'role']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        reviews: reviews.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(reviews.count / limit),
          totalItems: reviews.count
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicReviews,
  createReview,
  getAllReviews
};
