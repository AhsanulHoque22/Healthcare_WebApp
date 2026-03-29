const { Patient, User, MedicalRecord, Appointment } = require('../models');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const path = require('path');
const { uploadToCloudinary } = require('../services/cloudinaryService');

// Get patient profile
const getPatientProfile = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    
    const patient = await Patient.findByPk(patientId, {
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

// Update patient profile
const updatePatientProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const patientId = req.params.id;
    const { bloodType, allergies, emergencyContact, emergencyPhone, insuranceProvider, insuranceNumber } = req.body;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    await patient.update({
      bloodType: bloodType || null, // Convert empty string to null for ENUM
      allergies: allergies || null,
      emergencyContact: emergencyContact || null,
      emergencyPhone: emergencyPhone || null,
      insuranceProvider: insuranceProvider || null,
      insuranceNumber: insuranceNumber || null
    });

    const updatedPatient = await Patient.findByPk(patientId, {
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: { patient: updatedPatient }
    });
  } catch (error) {
    next(error);
  }
};

// Get patient medical records
const getMedicalRecords = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    const { page = 1, limit = 10, recordType } = req.query;

    const whereClause = { patientId };
    if (recordType) {
      whereClause.recordType = recordType;
    }

    const records = await MedicalRecord.findAndCountAll({
      where: whereClause,
      include: [
        {
          association: 'doctor',
          include: [{ association: 'user', attributes: ['firstName', 'lastName'] }]
        },
        {
          association: 'appointment',
          attributes: ['appointmentDate', 'appointmentTime']
        }
      ],
      order: [['recordDate', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        records: records.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(records.count / parseInt(limit)),
          totalRecords: records.count,
          hasNext: parseInt(page) * parseInt(limit) < records.count,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get patient appointments
const getPatientAppointments = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    const { page = 1, limit = 10, status, type } = req.query;

    const whereClause = { patientId };
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const appointments = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        {
          association: 'doctor',
          include: [{ association: 'user', attributes: ['firstName', 'lastName', 'email'] }]
        }
      ],
      order: [['appointmentDate', 'DESC']],
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

// Create medical record
const createMedicalRecord = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const patientId = req.params.id;
    const { doctorId, appointmentId, recordType, title, description, diagnosis, treatment, medications, vitalSigns, labResults, attachments, isPrivate } = req.body;

    const medicalRecord = await MedicalRecord.create({
      patientId,
      doctorId,
      appointmentId,
      recordType,
      title,
      description,
      diagnosis,
      treatment,
      medications,
      vitalSigns,
      labResults,
      attachments,
      isPrivate: isPrivate || false
    });

    const createdRecord = await MedicalRecord.findByPk(medicalRecord.id, {
      include: [
        {
          association: 'doctor',
          include: [{ association: 'user', attributes: ['firstName', 'lastName'] }]
        },
        {
          association: 'appointment',
          attributes: ['appointmentDate', 'appointmentTime']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: { medicalRecord: createdRecord }
    });
  } catch (error) {
    next(error);
  }
};

// Get current patient profile (using authenticated user)
const getCurrentPatientProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    
    const patient = await Patient.findOne({
      where: { userId },
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
        message: 'Patient profile not found'
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

// Update current patient profile (using authenticated user)
const updateCurrentPatientProfile = async (req, res, next) => {
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
    const { bloodType, allergies, emergencyContact, emergencyPhone, insuranceProvider, insuranceNumber, medicalHistory, currentMedications } = req.body;

    const patient = await Patient.findOne({
      where: { userId }
    });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    await patient.update({
      bloodType: bloodType || null, // Convert empty string to null for ENUM
      allergies: allergies || null,
      emergencyContact: emergencyContact || null,
      emergencyPhone: emergencyPhone || null,
      insuranceProvider: insuranceProvider || null,
      insuranceNumber: insuranceNumber || null,
      medicalHistory: medicalHistory || null,
      currentMedications: currentMedications || null
    });

    const updatedPatient = await Patient.findByPk(patient.id, {
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: { patient: updatedPatient }
    });
  } catch (error) {
    next(error);
  }
};

// Get patient dashboard stats
const getPatientDashboardStats = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      totalAppointments,
      todayAppointments,
      completedAppointments,
      pendingAppointments,
      requestedAppointments,
      scheduledAppointments
    ] = await Promise.all([
      Appointment.count({ where: { patientId } }),
      Appointment.count({ 
        where: { 
          patientId, 
          appointmentDate: { [Op.between]: [startOfDay, endOfDay] }
        }
      }),
      Appointment.count({ where: { patientId, status: 'completed' } }),
      Appointment.count({ where: { patientId, status: { [Op.in]: ['scheduled', 'confirmed'] } } }),
      Appointment.count({ where: { patientId, status: 'requested' } }),
      Appointment.count({ where: { patientId, status: 'scheduled' } })
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
          scheduledAppointments
        }
      }
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
    
    // Find the patient profile
    const patient = await Patient.findOne({
      where: { userId }
    });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Upload to Cloudinary
    let imageUrl = '';
    try {
      const result = await uploadToCloudinary(req.file.path, 'patient_profiles');
      imageUrl = result.secure_url;
    } catch (uploadError) {
      console.error('Cloudinary upload failure:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image to cloud storage'
      });
    }
    
    // Update the patient's profile image
    await patient.update({
      profileImage: imageUrl
    });

    // Also update the user's profile image
    const user = await User.findByPk(userId);
    if (user) {
      await user.update({
        profileImage: imageUrl
      });
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

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  getCurrentPatientProfile,
  updateCurrentPatientProfile,
  uploadProfileImage,
  getMedicalRecords,
  getPatientAppointments,
  getPatientDashboardStats,
  createMedicalRecord
};
