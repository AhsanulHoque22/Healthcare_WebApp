const { User, Patient, Doctor, Appointment, MedicalRecord, DoctorRating } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { body, validationResult } = require('express-validator');

// Get all users with pagination and filters
const getUsers = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      isActive, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const whereClause = {};
    
    if (role) whereClause.role = role;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        {
          association: 'patientProfile',
          required: false
        },
        {
          association: 'doctorProfile',
          required: false
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(users.count / parseInt(limit)),
          totalRecords: users.count,
          hasNext: parseInt(page) * parseInt(limit) < users.count,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          association: 'patientProfile',
          required: false
        },
        {
          association: 'doctorProfile',
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// Update user status
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, emailVerified } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;

    await user.update(updateData);

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by deactivating
    await user.update({ isActive: false });

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get system statistics
const getSystemStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalPatients,
      totalDoctors,
      totalAppointments,
      totalMedicalRecords,
      activeUsers,
      todayAppointments,
      completedAppointments,
      pendingAppointments
    ] = await Promise.all([
      User.count(),
      User.count({ where: { role: 'patient' } }),
      User.count({ where: { role: 'doctor' } }),
      Appointment.count(),
      MedicalRecord.count(),
      User.count({ where: { isActive: true } }),
      Appointment.count({
        where: {
          appointmentDate: {
            [Op.gte]: new Date().setHours(0, 0, 0, 0),
            [Op.lt]: new Date().setHours(23, 59, 59, 999)
          }
        }
      }),
      Appointment.count({ where: { status: 'completed' } }),
      Appointment.count({ where: { status: 'requested' } })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalPatients,
          totalDoctors,
          totalAppointments,
          totalMedicalRecords,
          activeUsers,
          todayAppointments,
          completedAppointments,
          pendingAppointments
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get appointment analytics
const getAppointmentAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const appointments = await Appointment.findAll({
      where: {
        appointmentDate: {
          [Op.gte]: startDate
        }
      },
      attributes: [
        'status',
        'type',
        'appointmentDate'
      ],
      raw: true
    });

    // Process analytics data
    const statusCounts = {};
    const typeCounts = {};
    const dailyCounts = {};

    appointments.forEach(appointment => {
      // Status counts
      statusCounts[appointment.status] = (statusCounts[appointment.status] || 0) + 1;
      
      // Type counts
      typeCounts[appointment.type] = (typeCounts[appointment.type] || 0) + 1;
      
      // Daily counts
      const date = new Date(appointment.appointmentDate).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        analytics: {
          statusCounts,
          typeCounts,
          dailyCounts,
          period: days
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get doctor verification requests
const getDoctorVerificationRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const doctors = await Doctor.findAndCountAll({
      where: { isVerified: false },
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] }
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        doctors: doctors.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(doctors.count / parseInt(limit)),
          totalRecords: doctors.count,
          hasNext: parseInt(page) * parseInt(limit) < doctors.count,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Verify doctor
const verifyDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const doctor = await Doctor.findByPk(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    await doctor.update({ isVerified });

    const updatedDoctor = await Doctor.findByPk(id, {
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    res.json({
      success: true,
      message: `Doctor ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: { doctor: updatedDoctor }
    });
  } catch (error) {
    next(error);
  }
};

// Get all patients with pagination and filters
const getPatients = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const whereClause = { role: 'patient' };
    
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const patients = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        {
          association: 'patientProfile',
          required: true
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    // Transform the data to match expected format
    const transformedPatients = patients.rows.map(user => ({
      id: user.patientProfile.id,
      ...user.patientProfile.dataValues,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin
      }
    }));

    res.json({
      success: true,
      data: {
        patients: transformedPatients,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(patients.count / parseInt(limit)),
          totalRecords: patients.count,
          hasNext: parseInt(page) * parseInt(limit) < patients.count,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get patient by ID
const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const patient = await Patient.findByPk(id, {
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: { patient }
    });
  } catch (error) {
    next(error);
  }
};

// Get all doctors (for admin use - includes unverified doctors)
const getAllDoctors = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search,
      isVerified,
      department,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const whereClause = { role: 'doctor' };
    const doctorWhereClause = {};
    
    if (isVerified !== undefined) doctorWhereClause.isVerified = isVerified === 'true';
    if (department) doctorWhereClause.department = department;
    
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const doctors = await Doctor.findAndCountAll({
      where: doctorWhereClause,
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] },
          where: whereClause
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    // Calculate average ratings for each doctor
    const doctorsWithRatings = await Promise.all(
      doctors.rows.map(async (doctor) => {
        const ratingStats = await DoctorRating.findOne({
          where: { doctorId: doctor.id },
          attributes: [
            [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'totalRatings']
          ],
          raw: true
        });

        return {
          ...doctor.toJSON(),
          calculatedRating: ratingStats?.averageRating ? parseFloat(ratingStats.averageRating) : 0,
          totalRatings: ratingStats?.totalRatings ? parseInt(ratingStats.totalRatings) : 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        doctors: doctorsWithRatings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(doctors.count / parseInt(limit)),
          totalRecords: doctors.count,
          hasNext: parseInt(page) * parseInt(limit) < doctors.count,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  getSystemStats,
  getAppointmentAnalytics,
  getAllDoctors,
  getDoctorVerificationRequests,
  verifyDoctor,
  getPatients,
  getPatientById
};
