const { Patient, User, MedicalRecord, Appointment, Prescription, LabTestOrder } = require('../models');
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
    const { 
      bloodType, allergies, emergencyContact, emergencyPhone, 
      insuranceProvider, insuranceNumber,
      height, weight, bloodPressure, pulse,
      chronicConditions, pastSurgeries, familyMedicalHistory,
      smokingStatus, alcoholConsumption, physicalActivity
    } = req.body;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Helper to handle numeric conversions properly
    const toNum = (val) => {
      if (val === '' || val === undefined || val === null) return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    try {
      await patient.update({
        bloodType: bloodType || null,
        allergies: allergies || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        insuranceProvider: insuranceProvider || null,
        insuranceNumber: insuranceNumber || null,
        height: toNum(height),
        weight: toNum(weight),
        bloodPressure: bloodPressure || null,
        pulse: toNum(pulse),
        chronicConditions: chronicConditions || null,
        pastSurgeries: pastSurgeries || null,
        familyMedicalHistory: familyMedicalHistory || null,
        smokingStatus: smokingStatus || null,
        alcoholConsumption: alcoholConsumption || null,
        physicalActivity: physicalActivity || null
      });
    } catch (dbError) {
      console.error('[patientController] Failed to update patient fields:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Database update failed. Ensure schema is up to date.',
        error: dbError.message
      });
    }

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
          include: [{ association: 'user', attributes: ['firstName', 'lastName', 'dateOfBirth', 'gender'] }]
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
          include: [{ association: 'user', attributes: ['firstName', 'lastName', 'dateOfBirth', 'gender'] }]
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
    const { 
      bloodType, allergies, emergencyContact, emergencyPhone, 
      insuranceProvider, insuranceNumber, medicalHistory, currentMedications,
      height, weight, bloodPressure, pulse,
      chronicConditions, pastSurgeries, familyMedicalHistory,
      smokingStatus, alcoholConsumption, physicalActivity
    } = req.body;

    const patient = await Patient.findOne({
      where: { userId }
    });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Helper to handle numeric conversions properly
    const toNum = (val) => {
      if (val === '' || val === undefined || val === null) return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    try {
      await patient.update({
        bloodType: bloodType || null,
        allergies: allergies || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        insuranceProvider: insuranceProvider || null,
        insuranceNumber: insuranceNumber || null,
        medicalHistory: medicalHistory || null,
        currentMedications: currentMedications || null,
        height: toNum(height),
        weight: toNum(weight),
        bloodPressure: bloodPressure || null,
        pulse: toNum(pulse),
        chronicConditions: chronicConditions || null,
        pastSurgeries: pastSurgeries || null,
        familyMedicalHistory: familyMedicalHistory || null,
        smokingStatus: smokingStatus || null,
        alcoholConsumption: alcoholConsumption || null,
        physicalActivity: physicalActivity || null
      });
    } catch (dbError) {
      console.error('[patientController] Failed to update patient fields:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Database update failed. Ensure schema is up to date.',
        error: dbError.message
      });
    }

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

// Upload medical document
const uploadMedicalDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided'
      });
    }

    const userId = req.user.id;
    const documentName = req.body.documentName || req.file.originalname;
    const documentType = req.body.documentType || 'Lab Report';
    
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
    let fileUrl = '';
    try {
      const result = await uploadToCloudinary(req.file.path, 'patient_documents');
      fileUrl = result.secure_url;
    } catch (uploadError) {
      console.error('Cloudinary document upload failure:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload document to cloud storage'
      });
    }
    
    // Append to medicalDocuments JSON array
    const currentDocuments = patient.medicalDocuments || [];
    const newDocument = {
      id: Date.now().toString(),
      name: documentName,
      type: documentType,
      url: fileUrl,
      fileName: req.file.originalname,
      uploadDate: new Date().toISOString()
    };
    
    await patient.update({
      medicalDocuments: [...currentDocuments, newDocument]
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        document: newDocument
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get patient medical summary (aggregated from prescriptions, labs, and profile)
const getPatientMedicalSummary = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    
    // 1. Fetch Patient Profile
    const patient = await Patient.findByPk(patientId, {
      include: [{ association: 'user', attributes: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone'] }]
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // 2. Fetch Latest Prescriptions (to extract Diagnoses, Symptoms, and Medications)
    const latestPrescriptions = await Prescription.findAll({
      where: { patientId },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [
        {
          association: 'doctor',
          include: [{ association: 'user', attributes: ['firstName', 'lastName'] }]
        }
      ]
    });

    // Extract aggregated data from prescriptions
    let summarizedDiagnoses = [];
    let recentSymptoms = [];
    let recentMedications = [];

    latestPrescriptions.forEach(presc => {
      // Parse diagnosis
      if (presc.diagnosis) {
        try {
          const diagData = typeof presc.diagnosis === 'string' && presc.diagnosis.startsWith('[') ? JSON.parse(presc.diagnosis) : presc.diagnosis;
          if (Array.isArray(diagData)) {
            summarizedDiagnoses.push(...diagData.map(d => typeof d === 'string' ? { condition: d, date: presc.createdAt } : { ...d, date: presc.createdAt }));
          } else if (typeof diagData === 'string') {
            summarizedDiagnoses.push({ condition: diagData, date: presc.createdAt });
          }
        } catch (e) {
          summarizedDiagnoses.push({ condition: presc.diagnosis, date: presc.createdAt });
        }
      }

      // Parse symptoms
      if (presc.symptoms) {
        try {
          const sympData = typeof presc.symptoms === 'string' && presc.symptoms.startsWith('[') ? JSON.parse(presc.symptoms) : presc.symptoms;
          if (Array.isArray(sympData)) {
            recentSymptoms.push(...sympData.map(s => typeof s === 'string' ? { symptom: s, date: presc.createdAt } : { ...s, date: presc.createdAt }));
          } else if (typeof sympData === 'string') {
            recentSymptoms.push({ symptom: sympData, date: presc.createdAt });
          }
        } catch (e) {
          recentSymptoms.push({ symptom: presc.symptoms, date: presc.createdAt });
        }
      }

      // Parse medicines (only from the most recent prescription to represent 'current')
      if (presc.medicines && recentMedications.length === 0) {
        try {
          const medData = typeof presc.medicines === 'string' && presc.medicines.startsWith('[') ? JSON.parse(presc.medicines) : presc.medicines;
          if (Array.isArray(medData)) {
            recentMedications = medData;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    // 3. Fetch Latest Lab Test Orders (completed ones have results)
    const latestLabOrders = await LabTestOrder.findAll({
      where: { patientId, status: { [Op.in]: ['completed', 'results_ready'] } },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Structured Lab Results
    let recentLabResults = latestLabOrders.map(order => ({
      orderId: order.orderNumber,
      date: order.createdAt,
      reports: order.testReports || []
    }));

    // 4. Construct Comprehensive Summary
    const medicalSummary = {
      patientInfo: {
        bloodType: patient.bloodType,
        height: patient.height,
        weight: patient.weight,
        bloodPressure: patient.bloodPressure,
        pulse: patient.pulse,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
        pastSurgeries: patient.pastSurgeries,
        familyMedicalHistory: patient.familyMedicalHistory,
        smokingStatus: patient.smokingStatus,
        alcoholConsumption: patient.alcoholConsumption,
        physicalActivity: patient.physicalActivity,
        profileCurrentMedications: patient.currentMedications
      },
      summarizedDiagnoses: summarizedDiagnoses.slice(0, 10), // Keep top 10 recent
      recentSymptoms: recentSymptoms.slice(0, 10),
      recentMedications: recentMedications, // From latest prescription
      recentLabResults: recentLabResults
    };

    res.json({
      success: true,
      data: { summary: medicalSummary }
    });

  } catch (error) {
    console.error('[patientController] getPatientMedicalSummary error:', error);
    next(error);
  }
};

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  getCurrentPatientProfile,
  updateCurrentPatientProfile,
  uploadProfileImage,
  uploadMedicalDocument,
  getMedicalRecords,
  getPatientAppointments,
  getPatientDashboardStats,
  createMedicalRecord,
  getPatientMedicalSummary
};
