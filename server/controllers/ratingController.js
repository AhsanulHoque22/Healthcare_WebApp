const { DoctorRating, Appointment, Patient, Doctor, User } = require('../models');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');

// Create a new doctor rating
const createRating = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { appointmentId, rating, review, feedback, isAnonymous } = req.body;
    const patientId = req.user.patientId;

    // Check if appointment exists and belongs to the patient
    const appointment = await Appointment.findOne({
      where: { 
        id: appointmentId,
        patientId: patientId,
        status: 'completed'
      },
      include: [
        { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user' }] }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or not completed'
      });
    }

    // Check if rating already exists for this appointment
    const existingRating = await DoctorRating.findOne({
      where: { appointmentId: appointmentId }
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'Rating already exists for this appointment'
      });
    }

    // Create the rating
    const newRating = await DoctorRating.create({
      appointmentId,
      patientId,
      doctorId: appointment.doctorId,
      rating,
      review,
      feedback,
      isAnonymous: isAnonymous || false,
      status: 'pending'
    });

    // Fetch the complete rating with associations
    const ratingWithDetails = await DoctorRating.findByPk(newRating.id, {
      include: [
        {
          model: Appointment,
          as: 'appointment',
          include: [
            { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user' }] }
          ]
        },
        {
          model: Patient,
          as: 'patient',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      data: { rating: ratingWithDetails }
    });
  } catch (error) {
    next(error);
  }
};

// Get ratings for a specific doctor
const getDoctorRatings = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { page = 1, limit = 10, status = 'all' } = req.query;

    const whereClause = { doctorId };
    if (status !== 'all') {
      whereClause.status = status;
    }

    const ratings = await DoctorRating.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Appointment,
          as: 'appointment',
          attributes: ['appointmentDate', 'appointmentTime', 'type']
        },
        {
          model: Patient,
          as: 'patient',
          include: [{
            model: User,
            as: 'user',
            attributes: ['firstName', 'lastName']
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Calculate average rating (include all ratings for public display)
    const avgRating = await DoctorRating.findOne({
      where: { doctorId },
      attributes: [
        [DoctorRating.sequelize.fn('AVG', DoctorRating.sequelize.col('rating')), 'averageRating'],
        [DoctorRating.sequelize.fn('COUNT', DoctorRating.sequelize.col('id')), 'totalRatings']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        ratings: ratings.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(ratings.count / parseInt(limit)),
          totalRatings: ratings.count,
          hasNext: parseInt(page) * parseInt(limit) < ratings.count,
          hasPrev: parseInt(page) > 1
        },
        summary: {
          averageRating: parseFloat(avgRating.averageRating || 0).toFixed(1),
          totalRatings: parseInt(avgRating.totalRatings || 0)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all ratings (for admin)
const getAllRatings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, doctorId, rating } = req.query;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (doctorId) whereClause.doctorId = doctorId;
    if (rating) whereClause.rating = rating;

    const ratings = await DoctorRating.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Appointment,
          as: 'appointment',
          include: [
            { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user' }] }
          ]
        },
        {
          model: Patient,
          as: 'patient',
          include: [{ model: User, as: 'user' }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        ratings: ratings.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(ratings.count / parseInt(limit)),
          totalRatings: ratings.count,
          hasNext: parseInt(page) * parseInt(limit) < ratings.count,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update rating status (for admin)
const updateRatingStatus = async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    const rating = await DoctorRating.findByPk(ratingId, {
      include: [
        {
          model: Appointment,
          as: 'appointment',
          include: [
            { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user' }] }
          ]
        },
        {
          model: Patient,
          as: 'patient',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    await rating.update({ status });

    res.json({
      success: true,
      message: 'Rating status updated successfully',
      data: { rating }
    });
  } catch (error) {
    next(error);
  }
};

// Get rating statistics for admin dashboard
const getRatingStats = async (req, res, next) => {
  try {
    // Overall statistics
    const overallStats = await DoctorRating.findOne({
      attributes: [
        [DoctorRating.sequelize.fn('AVG', DoctorRating.sequelize.col('rating')), 'averageRating'],
        [DoctorRating.sequelize.fn('COUNT', DoctorRating.sequelize.col('id')), 'totalRatings'],
        [DoctorRating.sequelize.fn('COUNT', DoctorRating.sequelize.literal('CASE WHEN status = "pending" THEN 1 END')), 'pendingRatings'],
        [DoctorRating.sequelize.fn('COUNT', DoctorRating.sequelize.literal('CASE WHEN status = "approved" THEN 1 END')), 'approvedRatings'],
        [DoctorRating.sequelize.fn('COUNT', DoctorRating.sequelize.literal('CASE WHEN status = "rejected" THEN 1 END')), 'rejectedRatings']
      ],
      raw: true
    });

    // Rating distribution
    const ratingDistribution = await DoctorRating.findAll({
      where: { status: 'approved' },
      attributes: [
        'rating',
        [DoctorRating.sequelize.fn('COUNT', DoctorRating.sequelize.col('id')), 'count']
      ],
      group: ['rating'],
      order: [['rating', 'DESC']],
      raw: true
    });

    // Recent ratings
    const recentRatings = await DoctorRating.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Appointment,
          as: 'appointment',
          include: [
            { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user' }] }
          ]
        },
        {
          model: Patient,
          as: 'patient',
          include: [{ model: User, as: 'user' }]
        }
      ]
    });

    res.json({
      success: true,
      data: {
        overall: {
          averageRating: parseFloat(overallStats.averageRating || 0).toFixed(1),
          totalRatings: parseInt(overallStats.totalRatings || 0),
          pendingRatings: parseInt(overallStats.pendingRatings || 0),
          approvedRatings: parseInt(overallStats.approvedRatings || 0),
          rejectedRatings: parseInt(overallStats.rejectedRatings || 0)
        },
        ratingDistribution,
        recentRatings
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get patient's own ratings
const getPatientRatings = async (req, res, next) => {
  try {
    const patientId = req.user.patientId;
    const { page = 1, limit = 10 } = req.query;

    const ratings = await DoctorRating.findAndCountAll({
      where: { patientId },
      include: [
        {
          model: Appointment,
          as: 'appointment',
          include: [
            { model: Doctor, as: 'doctor', include: [{ model: User, as: 'user' }] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        ratings: ratings.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(ratings.count / parseInt(limit)),
          totalRatings: ratings.count,
          hasNext: parseInt(page) * parseInt(limit) < ratings.count,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRating,
  getDoctorRatings,
  getAllRatings,
  updateRatingStatus,
  getRatingStats,
  getPatientRatings
};
