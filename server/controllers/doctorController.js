const { Doctor, User, Appointment, Patient, MedicalRecord, DoctorRating } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const path = require('path');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { createNotification } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

// Get all doctors (public endpoint)
const getAllDoctors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, department, specialization, search } = req.query;
    const targetDept = specialization || department;

    const whereClause = {
      role: 'doctor'
    };

    const doctorWhereClause = {
      isVerified: true
    };
    
    if (targetDept && targetDept !== 'All') {
      doctorWhereClause.department = targetDept;
    }

    if (search) {
      const searchRef = `%${search}%`;
      doctorWhereClause[Op.or] = [
        { '$user.firstName$': { [Op.like]: searchRef } },
        { '$user.lastName$': { [Op.like]: searchRef } },
        { '$user.email$': { [Op.like]: searchRef } },
        { department: { [Op.like]: searchRef } },
        { hospital: { [Op.like]: searchRef } },
        { bmdcRegistrationNumber: { [Op.like]: searchRef } },
        { bio: { [Op.like]: searchRef } }
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
      order: [['rating', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true,
      subQuery: false
    });

    // Calculate average ratings for each doctor
    const doctorsWithRatings = await Promise.all(
      doctors.rows.map(async (doctor) => {
        const ratingStats = await DoctorRating.findOne({
          where: { doctorId: doctor.id },
          attributes: [
            [DoctorRating.sequelize.fn('AVG', DoctorRating.sequelize.col('rating')), 'averageRating'],
            [DoctorRating.sequelize.fn('COUNT', DoctorRating.sequelize.col('id')), 'totalRatings']
          ],
          raw: true
        });

        const averageRating = parseFloat(ratingStats?.averageRating || 0);
        const totalRatings = parseInt(ratingStats?.totalRatings || 0);

        return {
          ...doctor.toJSON(),
          calculatedRating: averageRating,
          totalRatings: totalRatings
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

// Get doctor profile
const getDoctorProfile = async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    
    const doctor = await Doctor.findByPk(doctorId, {
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: { doctor }
    });
  } catch (error) {
    next(error);
  }
};

// Update doctor profile
const updateDoctorProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const doctorId = req.params.id;
    const { licenseNumber, department, experience, education, certifications, consultationFee, availability, bio } = req.body;

    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    await doctor.update({
      licenseNumber,
      department,
      experience,
      education,
      certifications,
      consultationFee,
      availability,
      bio
    });

    const updatedDoctor = await Doctor.findByPk(doctorId, {
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: { doctor: updatedDoctor }
    });
  } catch (error) {
    next(error);
  }
};

// Get doctor appointments
const getDoctorAppointments = async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    const { page = 1, limit = 10, status, type, date } = req.query;

    const whereClause = { doctorId };
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (date) {
      const startDate = new Date(date + 'T00:00:00.000Z');
      const endDate = new Date(date + 'T23:59:59.999Z');
      whereClause.appointmentDate = {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      };
    }

    const appointments = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        {
          association: 'patient',
          include: [{ association: 'user', attributes: ['firstName', 'lastName', 'email', 'phone'] }]
        }
      ],
      order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        appointments: appointments.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(appointments.count / parseInt(limit)),
          totalRecords: appointments.count,
          hasNext: parseInt(page) * parseInt(limit) < appointments.count,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update appointment status
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { status, notes, diagnosis, prescription, followUpDate } = req.body;

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    await appointment.update({
      status,
      notes,
      diagnosis,
      prescription,
      followUpDate
    });

    const updatedAppointment = await Appointment.findByPk(appointmentId, {
      include: [
        {
          association: 'patient',
          include: [{ association: 'user', attributes: ['firstName', 'lastName', 'email'] }]
        },
        {
          association: 'doctor',
          include: [{ association: 'user', attributes: ['firstName', 'lastName'] }]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    next(error);
  }
};

// Get doctor's patients
const getDoctorPatients = async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    const { page = 1, limit = 10, search } = req.query;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { '$user.firstName$': { [Op.like]: `%${search}%` } },
        { '$user.lastName$': { [Op.like]: `%${search}%` } },
        { '$user.email$': { [Op.like]: `%${search}%` } }
      ];
    }

    const patients = await Patient.findAndCountAll({
      where: whereClause,
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] }
        },
        {
          association: 'appointments',
          where: { doctorId },
          required: true,
          attributes: ['id', 'appointmentDate', 'status']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });

    res.json({
      success: true,
      data: {
        patients: patients.rows,
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

// Get doctor dashboard stats
const getDoctorDashboardStats = async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const [
      totalAppointments,
      todayAppointments,
      completedAppointments,
      pendingAppointments,
      requestedAppointments,
      inProgressAppointments,
      totalPatients
    ] = await Promise.all([
      Appointment.count({ where: { doctorId } }),
      Appointment.count({ 
        where: { 
          doctorId, 
          appointmentDate: { [Op.between]: [startOfDay, endOfDay] }
        }
      }),
      Appointment.count({ where: { doctorId, status: 'completed' } }),
      Appointment.count({ where: { doctorId, status: 'scheduled' } }),
      Appointment.count({ where: { doctorId, status: 'requested' } }),
      Appointment.count({ where: { doctorId, status: 'in_progress' } }),
      Patient.count({
        include: [{
          association: 'appointments',
          where: { doctorId },
          required: true
        }],
        distinct: true
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalAppointments,
          todayAppointments,
          completedAppointments,
          pendingAppointments,
          requestedAppointments,
          inProgressAppointments,
          totalPatients
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current doctor profile (using authenticated user)
const getCurrentDoctorProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    
    const doctor = await Doctor.findOne({
      where: { userId },
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    res.json({
      success: true,
      data: { doctor }
    });
  } catch (error) {
    next(error);
  }
};

// Update current doctor profile (using authenticated user)
const updateCurrentDoctorProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user.id; // From auth middleware
    const { 
      department,
      experience,
      education,
      certifications,
      profileImage,
      signature,
      degrees,
      awards,
      hospital,
      location,
      chamberTimes,
      chambers,
      consultationFee,
      languages,
      services,
      bio
    } = req.body;

    const doctor = await Doctor.findOne({
      where: { userId }
    });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    await doctor.update({
      department,
      experience,
      education,
      certifications,
      profileImage,
      signature,
      degrees,
      awards,
      hospital,
      location,
      chamberTimes,
      chambers,
      consultationFee: consultationFee === '' ? null : consultationFee,
      languages,
      services,
      bio
    });

    const updatedDoctor = await Doctor.findByPk(doctor.id, {
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: { doctor: updatedDoctor }
    });
  } catch (error) {
    next(error);
  }
};

// Upload profile image
const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const userId = req.user.id;
    
    // Find the doctor profile
    const doctor = await Doctor.findOne({
      where: { userId }
    });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Upload to Cloudinary
    let imageUrl = '';
    try {
      const result = await uploadToCloudinary(req.file.path, 'doctor_profiles');
      imageUrl = result.secure_url;
    } catch (uploadError) {
      console.error('Cloudinary upload failure:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image to cloud storage'
      });
    }
    
    // Update the doctor's profile image or signature
    const uploadType = req.query.type;
    if (uploadType === 'signature') {
      await doctor.update({
        signature: imageUrl
      });
    } else {
      await doctor.update({
        profileImage: imageUrl
      });

      // Also update the user's profile image
      const user = await User.findByPk(userId);
      if (user) {
        await user.update({
          profileImage: imageUrl
        });
      }
    }

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        imageUrl: imageUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// Send a critical health alert to a patient
const sendPatientAlert = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { urgency, message, action, subject } = req.body;

    if (!message || !urgency) {
      return res.status(400).json({
        success: false,
        message: 'Message and urgency level are required'
      });
    }

    // Validate urgency
    const validUrgency = ['routine', 'urgent', 'critical'];
    if (!validUrgency.includes(urgency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid urgency level. Must be: routine, urgent, or critical'
      });
    }

    // Find doctor profile
    const doctor = await Doctor.findOne({
      where: { userId: req.user.id },
      include: [{ association: 'user', attributes: ['firstName', 'lastName', 'email'] }]
    });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    // Find patient and their user
    const patient = await Patient.findByPk(patientId, {
      include: [{ association: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const doctorName = `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`;
    const patientName = `${patient.user.firstName} ${patient.user.lastName}`;

    // Map urgency to notification type
    const notifType = urgency === 'critical' ? 'error' : urgency === 'urgent' ? 'warning' : 'info';

    // Action label mapping
    const actionLabels = {
      follow_up: 'Schedule a Follow-up',
      admission: 'Immediate Admission Required',
      medication_change: 'Medication Adjustment Needed',
      monitoring: 'Increased Monitoring Advised'
    };
    const actionLabel = actionLabels[action] || action || '';

    const notifTitle = urgency === 'critical'
      ? `🚨 CRITICAL ALERT from ${doctorName}`
      : urgency === 'urgent'
        ? `⚠️ Urgent Message from ${doctorName}`
        : `📋 Message from ${doctorName}`;

    const notifMessage = `${message}${actionLabel ? `\n\nRecommended Action: ${actionLabel}` : ''}`;

    // 1. Create in-app notification for the patient
    await createNotification({
      userId: patient.user.id,
      title: notifTitle,
      message: notifMessage,
      type: notifType,
      targetRole: 'patient',
      actionType: `doctor_alert_${urgency}`,
      entityId: doctor.id,
      entityType: 'doctor'
    });

    // 2. Send email to the patient
    const urgencyColors = {
      critical: '#DC2626',
      urgent: '#F59E0B',
      routine: '#3B82F6'
    };
    const urgencyBg = {
      critical: '#FEF2F2',
      urgent: '#FFFBEB',
      routine: '#EFF6FF'
    };

    const emailSubject = subject || notifTitle.replace(/[🚨⚠️📋] /g, '');

    const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, ${urgencyColors[urgency]}, ${urgency === 'critical' ? '#991B1B' : urgency === 'urgent' ? '#D97706' : '#1D4ED8'}); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Livora Healthcare</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Doctor Health Advisory</p>
      </div>
      <div style="padding: 32px;">
        <div style="background: ${urgencyBg[urgency]}; border-left: 4px solid ${urgencyColors[urgency]}; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; font-weight: 700; color: ${urgencyColors[urgency]}; text-transform: uppercase; font-size: 13px; letter-spacing: 1px;">
            ${urgency} Priority
          </p>
        </div>
        <p style="color: #374151; font-size: 16px;">Dear <strong>${patientName}</strong>,</p>
        <p style="color: #374151; font-size: 15px; line-height: 1.6;"> ${message}</p>
        ${actionLabel ? `
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #6B7280;">Recommended Action:</p>
          <p style="margin: 8px 0 0; font-weight: 700; font-size: 16px; color: #111827;">${actionLabel}</p>
        </div>
        ` : ''}
        <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">This message was sent by <strong>${doctorName}</strong>. Please log into your Livora account for more details or contact the clinic directly.</p>
      </div>
      <div style="background: #F9FAFB; padding: 20px 32px; text-align: center; border-top: 1px solid #E5E7EB;">
        <p style="margin: 0; color: #9CA3AF; font-size: 12px;">Livora Healthcare • www.livora-health.app</p>
      </div>
    </div>
    `;

    try {
      await sendEmail({
        to: patient.user.email,
        subject: emailSubject,
        html: emailHtml
      });
      console.log(`✅ Alert email sent to ${patient.user.email} from ${doctorName}`);
    } catch (emailErr) {
      console.error('❌ Failed to send alert email:', emailErr.message);
      // Don't fail the whole request if email fails - notification was still created
    }

    res.json({
      success: true,
      message: `Health alert sent to ${patientName} successfully`,
      data: {
        urgency,
        action: actionLabel,
        patientName,
        emailSent: true
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDoctors,
  getDoctorProfile,
  updateDoctorProfile,
  getCurrentDoctorProfile,
  updateCurrentDoctorProfile,
  uploadProfileImage,
  getDoctorAppointments,
  updateAppointmentStatus,
  getDoctorPatients,
  getDoctorDashboardStats,
  sendPatientAlert
};
