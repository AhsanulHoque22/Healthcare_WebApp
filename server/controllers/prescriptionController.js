const { Prescription, Appointment, Patient, Doctor, User, Medicine, MedicineReminder } = require('../models');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/test-reports';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `test-report-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get prescription by appointment ID
const getPrescriptionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const prescription = await Prescription.findOne({
      where: { appointmentId: parseInt(appointmentId) },
      include: [
        {
          model: Appointment,
          as: 'appointment',
          include: [
            {
              model: Patient,
              as: 'patient',
              include: [{
                model: User,
                as: 'user',
                attributes: ['firstName', 'lastName', 'email', 'phone']
              }]
            },
            {
              model: Doctor,
              as: 'doctor',
              include: [{
                model: User,
                as: 'user',
                attributes: ['firstName', 'lastName', 'email']
              }]
            }
          ]
        }
      ]
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    res.json({
      success: true,
      data: { prescription }
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prescription',
      error: error.message
    });
  }
};

// Create or update prescription
const createOrUpdatePrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const prescriptionData = req.body;

    console.log(`[DEBUG] Prescription creation attempt for appointment ${appointmentId}`);

    // Check if appointment exists and is completed
    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        { model: Patient, as: 'patient' },
        { model: Doctor, as: 'doctor' }
      ]
    });

    console.log(`[DEBUG] Appointment ${appointmentId} status: ${appointment?.status}`);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (!['in_progress', 'completed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Can only create prescription for in-progress or completed appointments. Current status: ${appointment.status}`,
        debug: {
          appointmentId: appointment.id,
          status: appointment.status,
          allowedStatuses: ['in_progress', 'completed']
        }
      });
    }

    // Check if prescription already exists
    let prescription = await Prescription.findOne({
      where: { appointmentId: parseInt(appointmentId) }
    });

    if (prescription) {
      // Update existing prescription
      await prescription.update(prescriptionData);
    } else {
      // Create new prescription
      prescription = await Prescription.create({
        appointmentId: parseInt(appointmentId),
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        ...prescriptionData
      });
    }

    // Extract medicines from prescription and add to tracking system
    if (prescriptionData.medicines) {
      let medicinesArray = prescriptionData.medicines;
      
      // If medicines is a JSON string, parse it
      if (typeof medicinesArray === 'string') {
        try {
          medicinesArray = JSON.parse(medicinesArray);
        } catch (error) {
          console.error('Error parsing medicines JSON:', error);
        }
      }
      
      // If we have medicines (either array or parsed array), extract them
      if (Array.isArray(medicinesArray) && medicinesArray.length > 0) {
        console.log(`[DEBUG] Extracting ${medicinesArray.length} medicines from prescription ${prescription.id}`);
        await extractMedicinesFromPrescription(prescription.id);
      }
    }

    res.json({
      success: true,
      message: prescription ? 'Prescription updated successfully' : 'Prescription created successfully',
      data: { prescription }
    });
  } catch (error) {
    console.error('Error creating/updating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating/updating prescription',
      error: error.message
    });
  }
};

// Complete prescription
const completePrescription = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const prescription = await Prescription.findOne({
      where: { appointmentId: parseInt(appointmentId) }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    await prescription.update({
      status: 'completed',
      completedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Prescription completed successfully',
      data: { prescription }
    });
  } catch (error) {
    console.error('Error completing prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing prescription',
      error: error.message
    });
  }
};

// Upload test reports
const uploadTestReports = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const prescription = await Prescription.findOne({
      where: { appointmentId: parseInt(appointmentId) }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    const uploadedFiles = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      uploadedAt: new Date()
    }));

    // Update prescription with test reports
    const existingReports = prescription.testReports ? JSON.parse(prescription.testReports) : [];
    const updatedReports = [...existingReports, ...uploadedFiles];

    await prescription.update({
      testReports: JSON.stringify(updatedReports)
    });

    res.json({
      success: true,
      message: 'Test reports uploaded successfully',
      data: { uploadedFiles }
    });
  } catch (error) {
    console.error('Error uploading test reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading test reports',
      error: error.message
    });
  }
};

// Get test reports
const getTestReports = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const prescription = await Prescription.findOne({
      where: { appointmentId: parseInt(appointmentId) }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    const testReports = prescription.testReports ? JSON.parse(prescription.testReports) : [];

    res.json({
      success: true,
      data: { testReports }
    });
  } catch (error) {
    console.error('Error fetching test reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test reports',
      error: error.message
    });
  }
};

// Download test report
const downloadTestReport = async (req, res) => {
  try {
    const { appointmentId, filename } = req.params;

    const prescription = await Prescription.findOne({
      where: { appointmentId: parseInt(appointmentId) }
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    const testReports = prescription.testReports ? JSON.parse(prescription.testReports) : [];
    const report = testReports.find(r => r.filename === filename);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Test report not found'
      });
    }

    const filePath = path.join(__dirname, '..', report.path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    res.download(filePath, report.originalName);
  } catch (error) {
    console.error('Error downloading test report:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading test report',
      error: error.message
    });
  }
};

// Extract medicines from prescription and add to tracking system
const extractMedicinesFromPrescription = async (prescriptionId) => {
  try {
    const prescription = await Prescription.findByPk(prescriptionId, {
      include: [
        {
          model: Appointment,
          as: 'appointment',
          include: [
            {
              model: Patient,
              as: 'patient'
            },
            {
              model: Doctor,
              as: 'doctor'
            }
          ]
        }
      ]
    });

    if (!prescription || !prescription.medicines) {
      return { success: false, message: 'No medicines found in prescription' };
    }

    // Parse medicines if it's a JSON string
    let medicinesArray = prescription.medicines;
    if (typeof medicinesArray === 'string') {
      try {
        medicinesArray = JSON.parse(medicinesArray);
      } catch (error) {
        console.error('Error parsing medicines JSON:', error);
        return { success: false, message: 'Invalid medicines data format' };
      }
    }

    if (!Array.isArray(medicinesArray) || medicinesArray.length === 0) {
      return { success: false, message: 'No medicines found in prescription' };
    }

    const createdMedicines = [];

    for (const medicineData of medicinesArray) {
      // Check if medicine already exists for this patient
      const existingMedicine = await Medicine.findOne({
        where: {
          patientId: prescription.appointment.patient.id,
          medicineName: medicineData.name,
          isActive: true
        }
      });

      if (existingMedicine) {
        // Update existing medicine instead of creating duplicate
        await existingMedicine.update({
          dosage: medicineData.dosage,
          frequency: medicineData.schedule,
          instructions: medicineData.instructions,
          endDate: null // Reset end date for active medicine
        });
        createdMedicines.push(existingMedicine);
        continue;
      }

      // Format dosage with unit
      let dosageWithUnit = medicineData.dosage || 'Not specified';
      
      if (medicineData.dosage && medicineData.unit) {
        // If unit is provided, use it
        dosageWithUnit = `${medicineData.dosage}${medicineData.unit}`;
      } else if (medicineData.dosage) {
        // If no unit provided, add default units based on common medicine types
        const medicineName = medicineData.name.toLowerCase();
        if (medicineName.includes('syrup') || medicineName.includes('liquid') || medicineName.includes('drops')) {
          dosageWithUnit = `${medicineData.dosage}ml`;
        } else {
          // Default to mg for tablets/capsules
          dosageWithUnit = `${medicineData.dosage}mg`;
        }
      }

      // Format frequency based on morning/lunch/dinner values
      let frequency = 'As directed';
      if (medicineData.morning !== undefined && medicineData.lunch !== undefined && medicineData.dinner !== undefined) {
        const times = [];
        if (medicineData.morning > 0) times.push('morning');
        if (medicineData.lunch > 0) times.push('lunch');
        if (medicineData.dinner > 0) times.push('dinner');
        
        if (times.length > 0) {
          frequency = times.join(' + ');
          if (medicineData.mealTiming) {
            frequency += ` (${medicineData.mealTiming} meal)`;
          }
        }
      }

      // Calculate end date based on duration
      let endDate = null;
      if (medicineData.duration && medicineData.duration > 0) {
        const startDate = new Date();
        endDate = new Date(startDate.getTime() + (medicineData.duration * 24 * 60 * 60 * 1000));
      }

      // Create new medicine
      const medicine = await Medicine.create({
        patientId: prescription.appointment.patient.id,
        prescriptionId: prescription.id,
        medicineName: medicineData.name,
        dosage: dosageWithUnit,
        frequency: frequency,
        duration: medicineData.duration || null,
        instructions: medicineData.notes || medicineData.instructions || '',
        startDate: new Date(),
        endDate: endDate,
        isActive: true,
        doctorId: prescription.appointment.doctor.id
      });

      // Create reminders based on frequency
      if (medicineData.schedule) {
        const reminders = createRemindersFromSchedule(medicineData.schedule, medicine.id, prescription.appointment.patient.id);
        await MedicineReminder.bulkCreate(reminders);
      }

      createdMedicines.push(medicine);
    }

    return { success: true, data: createdMedicines };
  } catch (error) {
    console.error('Error extracting medicines from prescription:', error);
    return { success: false, message: error.message };
  }
};

// Helper function to create reminders from schedule
const createRemindersFromSchedule = (schedule, medicineId, patientId) => {
  const reminders = [];
  const scheduleLower = schedule.toLowerCase();

  // Parse schedule and create appropriate reminders
  if (scheduleLower.includes('daily') || scheduleLower.includes('once a day') || scheduleLower.includes('1 time')) {
    reminders.push({
      medicineId,
      patientId,
      time: '08:00',
      dayOfWeek: 'all',
      isActive: true,
      nextReminderAt: calculateNextReminder('08:00', 'all')
    });
  }
  
  if (scheduleLower.includes('twice') || scheduleLower.includes('2 times') || scheduleLower.includes('bid')) {
    reminders.push(
      {
        medicineId,
        patientId,
        time: '08:00',
        dayOfWeek: 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder('08:00', 'all')
      },
      {
        medicineId,
        patientId,
        time: '20:00',
        dayOfWeek: 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder('20:00', 'all')
      }
    );
  }
  
  if (scheduleLower.includes('three times') || scheduleLower.includes('3 times') || scheduleLower.includes('tid')) {
    reminders.push(
      {
        medicineId,
        patientId,
        time: '08:00',
        dayOfWeek: 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder('08:00', 'all')
      },
      {
        medicineId,
        patientId,
        time: '14:00',
        dayOfWeek: 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder('14:00', 'all')
      },
      {
        medicineId,
        patientId,
        time: '20:00',
        dayOfWeek: 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder('20:00', 'all')
      }
    );
  }
  
  if (scheduleLower.includes('four times') || scheduleLower.includes('4 times') || scheduleLower.includes('qid')) {
    reminders.push(
      {
        medicineId,
        patientId,
        time: '06:00',
        dayOfWeek: 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder('06:00', 'all')
      },
      {
        medicineId,
        patientId,
        time: '12:00',
        dayOfWeek: 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder('12:00', 'all')
      },
      {
        medicineId,
        patientId,
        time: '18:00',
        dayOfWeek: 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder('18:00', 'all')
      },
      {
        medicineId,
        patientId,
        time: '22:00',
        dayOfWeek: 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder('22:00', 'all')
      }
    );
  }

  // Default reminder if no pattern matches
  if (reminders.length === 0) {
    reminders.push({
      medicineId,
      patientId,
      time: '08:00',
      dayOfWeek: 'all',
      isActive: true,
      nextReminderAt: calculateNextReminder('08:00', 'all')
    });
  }
  
  return reminders;
};

// Helper function to calculate next reminder time
const calculateNextReminder = (reminderTime, dayOfWeek) => {
  const now = new Date();
  
  // Parse reminder time
  const [hours, minutes] = reminderTime.split(':').map(Number);
  
  // If dayOfWeek is 'all', use today or tomorrow
  if (dayOfWeek === 'all') {
    const nextDate = new Date(now);
    nextDate.setHours(hours, minutes, 0, 0);
    
    // If time hasn't passed today, use today
    if (nextDate > now) {
      return nextDate;
    } else {
      // Otherwise use tomorrow
      nextDate.setDate(now.getDate() + 1);
      return nextDate;
    }
  }
  
  // For specific days, find next occurrence
  const targetDay = parseInt(dayOfWeek);
  const today = now.getDay();
  const daysUntilTarget = (targetDay - today + 7) % 7;
  
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntilTarget);
  nextDate.setHours(hours, minutes, 0, 0);
  
  return nextDate;
};

module.exports = {
  getPrescriptionByAppointment,
  createOrUpdatePrescription,
  completePrescription,
  uploadTestReports,
  getTestReports,
  downloadTestReport,
  extractMedicinesFromPrescription,
  upload
};