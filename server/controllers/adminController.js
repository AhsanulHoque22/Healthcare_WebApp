const { User, Patient, Doctor, Appointment, MedicalRecord, DoctorRating } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { body, validationResult } = require('express-validator');
const { sendEmail } = require('../services/emailService');
const {
  triggerDoctorVerified,
  triggerUserDeactivated,
  triggerNewUserRegistration,
  buildEmailHtml,
} = require('../services/notificationTriggers');

// Input validation helper - prevents SQL injection in LIKE queries
const validateSearchInput = (search) => {
  if (!search || typeof search !== 'string') return null;
  // Allow alphanumeric, spaces, hyphens, and dots only
  const sanitized = search.replace(/[^a-zA-Z0-9\s\.\-@]/g, '').trim();
  if (sanitized.length === 0 || sanitized.length > 100) return null;
  return sanitized;
};

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

    // Validate and sanitize numeric parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    const whereClause = {};
    
    if (role && ['admin', 'doctor', 'patient'].includes(role)) {
      whereClause.role = role;
    }
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    
    // Validate search input
    const validatedSearch = validateSearchInput(search);
    if (validatedSearch) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${validatedSearch}%` } },
        { lastName: { [Op.like]: `%${validatedSearch}%` } },
        { email: { [Op.like]: `%${validatedSearch}%` } }
      ];
    }

    // Validate sortBy parameter
    const allowedSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'updatedAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrderUpper = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

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
      order: [[sortField, sortOrderUpper]],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(users.count / limitNum),
          totalRecords: users.count,
          hasNext: pageNum * limitNum < users.count,
          hasPrev: pageNum > 1
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

    if (isActive === false) {
      triggerUserDeactivated(updatedUser.get({ plain: true })).catch((err) =>
        console.error('[adminController] triggerUserDeactivated:', err.message)
      );

      // Email the deactivated user directly
      sendEmail({
        to: updatedUser.email,
        subject: 'Account Deactivated – Livora',
        html: buildEmailHtml('Your Account Has Been Deactivated', `
          <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Hello ${updatedUser.firstName || ''},</p>
          <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Your Livora account has been deactivated by an administrator.</p>
          <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">If you believe this is a mistake or have questions, please contact our support team.</p>
          <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
        `)
      }).catch(err => console.error('[adminController] Deactivation email failed:', err.message));
    } else if (isActive === true) {
      // Email the reactivated user directly
      sendEmail({
        to: updatedUser.email,
        subject: 'Account Reactivated – Livora',
        html: buildEmailHtml('Your Account Has Been Reactivated', `
          <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Hello ${updatedUser.firstName || ''},</p>
          <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Great news! Your Livora account has been reactivated by an administrator.</p>
          <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">You can now log in to your dashboard and resume using all Livora services.</p>
          <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
        `)
      }).catch(err => console.error('[adminController] Reactivation email failed:', err.message));
    }

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

    const updatedUser = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    triggerUserDeactivated(updatedUser.get({ plain: true })).catch((err) =>
      console.error('[adminController] triggerUserDeactivated:', err.message)
    );

    // Email the deactivated user directly
    sendEmail({
      to: updatedUser.email,
      subject: 'Account Deactivated – Livora',
      html: buildEmailHtml('Your Account Has Been Deactivated', `
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Hello ${updatedUser.firstName || ''},</p>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 16px;">Your Livora account has been deactivated by an administrator.</p>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 20px;">If you believe this is a mistake or have questions, please contact our support team.</p>
        <p style="color:#718096;font-size:14px;margin:0;">Best regards,<br/><strong>The Livora Team</strong></p>
      `)
    }).catch(err => console.error('[adminController] Deactivation email failed:', err.message));

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
      verifiedDoctors,
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
      Doctor.count({ where: { isVerified: true } }),
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
          verifiedDoctors,
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

    triggerDoctorVerified(updatedDoctor.get({ plain: true }), isVerified).catch((err) =>
      console.error('[adminController] triggerDoctorVerified:', err.message)
    );

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

    // Validate and sanitize numeric parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    const whereClause = { role: 'patient' };
    
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    
    // Validate search input
    const validatedSearch = validateSearchInput(search);
    if (validatedSearch) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${validatedSearch}%` } },
        { lastName: { [Op.like]: `%${validatedSearch}%` } },
        { email: { [Op.like]: `%${validatedSearch}%` } }
      ];
    }

    // Validate sortBy parameter
    const allowedSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'updatedAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrderUpper = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const patients = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        {
          association: 'patientProfile',
          required: true
        }
      ],
      order: [[sortField, sortOrderUpper]],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum
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
          currentPage: pageNum,
          totalPages: Math.ceil(patients.count / limitNum),
          totalRecords: patients.count,
          hasNext: pageNum * limitNum < patients.count,
          hasPrev: pageNum > 1
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

    // Validate and sanitize numeric parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    const whereClause = { role: 'doctor' };
    const doctorWhereClause = {};
    
    if (isVerified !== undefined) doctorWhereClause.isVerified = isVerified === 'true';
    
    // Validate department parameter
    if (department && typeof department === 'string') {
      const validatedDept = validateSearchInput(department);
      if (validatedDept) {
        doctorWhereClause.department = validatedDept;
      }
    }
    
    // Validate search input
    const validatedSearch = validateSearchInput(search);
    if (validatedSearch) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${validatedSearch}%` } },
        { lastName: { [Op.like]: `%${validatedSearch}%` } },
        { email: { [Op.like]: `%${validatedSearch}%` } }
      ];
    }

    // Validate sortBy parameter
    const allowedSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'updatedAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrderUpper = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const doctors = await Doctor.findAndCountAll({
      where: doctorWhereClause,
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] },
          where: whereClause
        }
      ],
      order: [[sortField, sortOrderUpper]],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
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
          currentPage: pageNum,
          totalPages: Math.ceil(doctors.count / limitNum),
          totalRecords: doctors.count,
          hasNext: pageNum * limitNum < doctors.count,
          hasPrev: pageNum > 1
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
