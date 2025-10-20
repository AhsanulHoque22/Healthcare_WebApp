const { Appointment, Patient, Doctor, User, Prescription, MedicalRecord } = require('../models');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');

// Create appointment
const createAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { patientId, doctorId, appointmentDate, timeBlock, duration, type, reason, symptoms } = req.body;

    // Check if doctor exists and is verified
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (!doctor.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book appointment with unverified doctor'
      });
    }

    // Check if patient exists
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Convert time block to start time for the appointment
    let appointmentTime;
    if (timeBlock === '09:00-12:00') {
      appointmentTime = '09:00:00';
    } else if (timeBlock === '14:00-17:00') {
      appointmentTime = '14:00:00';
    } else if (timeBlock === '19:00-22:00') {
      appointmentTime = '19:00:00';
    } else {
      // Custom time block - use the first part as start time
      appointmentTime = `${timeBlock.split('-')[0]}:00:00`;
    }

    // Generate serial number for this doctor on this date (resets daily)
    const dateStr = new Date(appointmentDate).toISOString().split('T')[0];
    const existingAppointmentsCount = await Appointment.count({
      where: {
        doctorId,
        appointmentDate: {
          [Op.and]: [
            { [Op.gte]: new Date(`${dateStr}T00:00:00`) },
            { [Op.lt]: new Date(`${dateStr}T23:59:59`) }
          ]
        }
      }
    });
    const serialNumber = existingAppointmentsCount + 1;

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      duration: duration || 180, // Default 3 hours for chamber blocks
      serialNumber: serialNumber,
      type: type || 'in_person',
      reason,
      symptoms,
      status: 'requested' // Changed to 'requested' - requires doctor approval
    });

    const createdAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        {
          association: 'patient',
          include: [{ association: 'user', attributes: ['firstName', 'lastName', 'email', 'phone'] }]
        },
        {
          association: 'doctor',
          include: [{ association: 'user', attributes: ['firstName', 'lastName', 'email'] }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: { appointment: createdAppointment }
    });
  } catch (error) {
    next(error);
  }
};

// Get appointments with filters
const getAppointments = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      doctorId, 
      patientId, 
      date,
      startDate,
      endDate
    } = req.query;

    const whereClause = {};
    const userId = req.user.id; // From auth middleware
    const userRole = req.user.role;
    
    // Filter appointments based on user role
    if (userRole === 'patient') {
      // Patients see only their own appointments
      const patient = await Patient.findOne({ where: { userId } });
      if (patient) {
        whereClause.patientId = patient.id;
      } else {
        return res.json({
          success: true,
          data: { 
            appointments: [], 
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalRecords: 0,
              hasNext: false,
              hasPrev: false
            }
          }
        });
      }
    } else if (userRole === 'doctor') {
      // Doctors see only their own appointments
      const doctor = await Doctor.findOne({ where: { userId } });
      if (doctor) {
        whereClause.doctorId = doctor.id;
      } else {
        return res.json({
          success: true,
          data: { 
            appointments: [], 
            pagination: {
              currentPage: parseInt(page),
              totalPages: 0,
              totalRecords: 0,
              hasNext: false,
              hasPrev: false
            }
          }
        });
      }
    }
    // Admins can see all appointments (no additional filter)
    
    // Additional filters
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (doctorId && userRole === 'admin') whereClause.doctorId = doctorId;
    if (patientId && userRole === 'admin') whereClause.patientId = patientId;
    
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      whereClause.appointmentDate = {
        [Op.gte]: startOfDay,
        [Op.lt]: endOfDay
      };
    }
    
    if (startDate && endDate) {
      whereClause.appointmentDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const appointments = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        {
          association: 'patient',
          include: [{ association: 'user', attributes: ['firstName', 'lastName', 'email', 'phone'] }]
        },
        {
          association: 'doctor',
          include: [{ association: 'user', attributes: ['firstName', 'lastName', 'email'] }]
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

// Get single appointment
const getAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByPk(id, {
      include: [
        {
          association: 'patient',
          include: [{ association: 'user', attributes: { exclude: ['password'] } }]
        },
        {
          association: 'doctor',
          include: [{ association: 'user', attributes: { exclude: ['password'] } }]
        },
        {
          association: 'medicalRecords',
          include: [
            {
              association: 'doctor',
              include: [{ association: 'user', attributes: ['firstName', 'lastName'] }]
            }
          ]
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

// Cancel appointment
const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed appointment'
      });
    }

    await appointment.update({
      status: 'cancelled',
      notes: reason ? `${appointment.notes || ''}\nCancellation reason: ${reason}`.trim() : appointment.notes
    });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Reschedule appointment
const rescheduleAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { appointmentDate, appointmentTime, duration } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule completed appointment'
      });
    }

    // Check for conflicting appointments
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const endTime = new Date(appointmentDateTime.getTime() + (duration || appointment.duration) * 60000);

    const conflictingAppointment = await Appointment.findOne({
      where: {
        doctorId: appointment.doctorId,
        appointmentDate: appointmentDate,
        id: { [Op.ne]: id },
        [Op.or]: [
          {
            appointmentTime: {
              [Op.between]: [appointmentTime, endTime.toTimeString().slice(0, 8)]
            }
          }
        ],
        status: {
          [Op.in]: ['scheduled', 'confirmed']
        }
      }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Doctor has a conflicting appointment at this time'
      });
    }

    await appointment.update({
      appointmentDate,
      appointmentTime,
      duration: duration || appointment.duration,
      status: 'scheduled'
    });

    const updatedAppointment = await Appointment.findByPk(id, {
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
      message: 'Appointment rescheduled successfully',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    next(error);
  }
};

// Approve appointment (Doctor only)
const approveAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'Only requested appointments can be approved'
      });
    }

    await appointment.update({ status: 'scheduled' });

    const updatedAppointment = await Appointment.findByPk(id, {
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
      message: 'Appointment approved successfully',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    next(error);
  }
};

// Decline appointment (Doctor only)
const declineAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'Only requested appointments can be declined'
      });
    }

    await appointment.update({ 
      status: 'cancelled',
      notes: reason ? `Declined by doctor: ${reason}` : 'Declined by doctor'
    });

    const updatedAppointment = await Appointment.findByPk(id, {
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
      message: 'Appointment declined successfully',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    next(error);
  }
};

// Reschedule requested appointment (Doctor only)
const rescheduleRequestedAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { appointmentDate, timeBlock } = req.body;
    
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status !== 'requested') {
      return res.status(400).json({
        success: false,
        message: 'Only requested appointments can be rescheduled this way'
      });
    }

    // Convert time block to start time
    let appointmentTime;
    if (timeBlock === '09:00-12:00') {
      appointmentTime = '09:00:00';
    } else if (timeBlock === '14:00-17:00') {
      appointmentTime = '14:00:00';
    } else if (timeBlock === '19:00-22:00') {
      appointmentTime = '19:00:00';
    } else {
      appointmentTime = `${timeBlock.split('-')[0]}:00:00`;
    }

    await appointment.update({ 
      appointmentDate,
      appointmentTime,
      status: 'scheduled' // Approve and reschedule in one action
    });

    const updatedAppointment = await Appointment.findByPk(id, {
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
      message: 'Appointment rescheduled and approved successfully',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    next(error);
  }
};

// Start appointment (Doctor only) - mark as in_progress
const startAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled or confirmed appointments can be started'
      });
    }

    await appointment.update({ 
      status: 'in_progress',
      startedAt: new Date() // Record start timestamp
    });

    const updatedAppointment = await Appointment.findByPk(id, {
      include: [
        {
          association: 'patient',
          include: [{ association: 'user', attributes: ['firstName', 'lastName', 'email'] }]
        },
        {
          association: 'doctor',
          include: [{ association: 'user', attributes: ['firstName', 'lastName'] }]
        },
        {
          association: 'prescriptionDetails'
        }
      ]
    });

    res.json({
      success: true,
      message: 'Appointment started - now in progress',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    next(error);
  }
};

// Complete appointment (Doctor only)
const completeAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (!['scheduled', 'confirmed', 'in_progress'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled, confirmed, or in-progress appointments can be marked as completed'
      });
    }

    // If appointment was never started (no startedAt), record it now
    const updateData = { 
      status: 'completed',
      completedAt: new Date()
    };
    
    if (!appointment.startedAt) {
      updateData.startedAt = new Date();
    }

    await appointment.update(updateData);

    const updatedAppointment = await Appointment.findByPk(id, {
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

    // Create basic medical record for completed appointment (if no prescription exists)
    await createBasicMedicalRecord(updatedAppointment);

    res.json({
      success: true,
      message: 'Appointment marked as completed',
      data: { appointment: updatedAppointment }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to create basic medical record for completed appointment
const createBasicMedicalRecord = async (appointment) => {
  try {
    // Check if a medical record already exists for this appointment
    const existingRecord = await MedicalRecord.findOne({
      where: { appointmentId: appointment.id }
    });

    if (existingRecord) {
      console.log(`Medical record already exists for appointment ${appointment.id}`);
      return;
    }

    const patient = appointment.patient;
    const doctor = appointment.doctor;

    // Create comprehensive description from appointment data
    let description = `APPOINTMENT DETAILS\n`;
    description += `==================\n\n`;
    description += `Date: ${new Date(appointment.appointmentDate).toLocaleDateString()}\n`;
    description += `Time: ${appointment.appointmentTime}\n`;
    description += `Type: ${appointment.type.replace('_', ' ')}\n`;
    description += `Duration: ${appointment.duration} minutes\n`;
    description += `Serial Number: ${appointment.serialNumber || 'N/A'}\n`;
    description += `Status: ${appointment.status}\n\n`;

    if (appointment.reason) {
      description += `REASON FOR VISIT:\n${appointment.reason}\n\n`;
    }

    if (appointment.symptoms) {
      description += `SYMPTOMS:\n${appointment.symptoms}\n\n`;
    }

    if (appointment.notes) {
      description += `DOCTOR'S NOTES:\n${appointment.notes}\n\n`;
    }

    if (appointment.diagnosis) {
      description += `DIAGNOSIS:\n${appointment.diagnosis}\n\n`;
    }

    if (appointment.prescription) {
      description += `PRESCRIPTION:\n${appointment.prescription}\n\n`;
    }

    if (appointment.followUpDate) {
      description += `FOLLOW-UP DATE:\n${new Date(appointment.followUpDate).toLocaleDateString()}\n\n`;
    }

    if (appointment.meetingLink) {
      description += `MEETING LINK:\n${appointment.meetingLink}\n\n`;
    }

    if (appointment.fee) {
      description += `CONSULTATION FEE:\n${appointment.fee} BDT\n\n`;
    }

    if (appointment.paymentStatus) {
      description += `PAYMENT STATUS:\n${appointment.paymentStatus}\n\n`;
    }

    if (appointment.startedAt) {
      description += `APPOINTMENT STARTED:\n${new Date(appointment.startedAt).toLocaleString()}\n\n`;
    }

    if (appointment.completedAt) {
      description += `APPOINTMENT COMPLETED:\n${new Date(appointment.completedAt).toLocaleString()}\n\n`;
    }

    // Create medical record
    await MedicalRecord.create({
      patientId: patient.id,
      doctorId: doctor.id,
      appointmentId: appointment.id,
      recordType: 'consultation',
      title: `Appointment - ${new Date(appointment.appointmentDate).toLocaleDateString()}`,
      description: description,
      diagnosis: appointment.diagnosis || null,
      treatment: appointment.prescription || null,
      medications: appointment.prescription || null,
      recordDate: new Date(appointment.appointmentDate)
    });

    console.log(`Medical record created for appointment ${appointment.id}`);
  } catch (error) {
    console.error('Error creating medical record:', error);
    // Don't throw error to avoid breaking appointment completion
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointment,
  cancelAppointment,
  rescheduleAppointment,
  approveAppointment,
  declineAppointment,
  rescheduleRequestedAppointment,
  startAppointment,
  completeAppointment
};
