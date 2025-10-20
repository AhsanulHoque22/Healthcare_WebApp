const { Medicine, MedicineReminder, MedicineDosage, Patient, Doctor, Prescription, PatientReminderSettings } = require('../models');
const { Op } = require('sequelize');

// Helper function to auto-complete medicines when end date passes
const autoCompleteExpiredMedicines = async () => {
  try {
    const now = new Date();
    
    // Find medicines that are active but have passed their end date
    const expiredMedicines = await Medicine.findAll({
      where: {
        isActive: true,
        endDate: {
          [Op.lt]: now
        }
      },
      include: [
        {
          model: MedicineDosage,
          as: 'dosages',
          attributes: ['id', 'takenAt']
        }
      ]
    });
    
    if (expiredMedicines.length > 0) {
      console.log(`Auto-completing ${expiredMedicines.length} expired medicines`);
      
      // Update medicines to inactive and calculate final adherence
      for (const medicine of expiredMedicines) {
        const adherence = calculateAdherencePercentage(medicine);
        
        await medicine.update({
          isActive: false,
          // Add completion note with adherence percentage
          instructions: (medicine.instructions || '') + 
            `\n\nMedicine course completed on ${now.toLocaleDateString()}. Final adherence: ${adherence}%`
        });
      }
      
      // Deactivate all reminders for these medicines
      await MedicineReminder.update(
        { isActive: false },
        {
          where: {
            medicineId: {
              [Op.in]: expiredMedicines.map(m => m.id)
            }
          }
        }
      );
      
      console.log(`Successfully auto-completed ${expiredMedicines.length} medicines with adherence tracking`);
    }
    
    return expiredMedicines.length;
  } catch (error) {
    console.error('Error auto-completing expired medicines:', error);
    return 0;
  }
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

// Get all medicines for a patient
const getPatientMedicines = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status = 'active' } = req.query;
    
    // Auto-complete expired medicines before fetching
    await autoCompleteExpiredMedicines();

    let whereCondition = { patientId };
    
    if (status === 'active') {
      whereCondition.isActive = true;
      whereCondition[Op.or] = [
        { endDate: null }, // Medicines with no end date (ongoing)
        { endDate: { [Op.gt]: new Date() } } // Medicines that haven't reached end date yet
      ];
    } else if (status === 'completed') {
      whereCondition[Op.or] = [
        { endDate: { [Op.lte]: new Date() } }, // Medicines that have reached end date
        { isActive: false } // Manually deactivated medicines
      ];
    } else if (status === 'inactive') {
      whereCondition.isActive = false;
    }

    const medicines = await Medicine.findAll({
      where: whereCondition,
      include: [
        {
          model: MedicineReminder,
          as: 'reminders',
          where: { isActive: true },
          required: false
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [{
            model: require('../models').User,
            as: 'user',
            attributes: ['firstName', 'lastName']
          }],
          required: false
        },
        {
          model: Prescription,
          as: 'prescription',
          required: false
        }
      ],
      order: [['startDate', 'DESC']]
    });

    // Get recent dosages for each medicine
    const medicinesWithDosages = await Promise.all(medicines.map(async (medicine) => {
      const recentDosages = await MedicineDosage.findAll({
        where: {
          medicineId: medicine.id,
          takenAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        order: [['takenAt', 'DESC']],
        limit: 10
      });

      return {
        ...medicine.toJSON(),
        name: medicine.medicineName,
        recentDosages
      };
    }));

    res.json({
      success: true,
      data: medicinesWithDosages
    });
  } catch (error) {
    console.error('Error fetching patient medicines:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medicines',
      error: error.message
    });
  }
};

// Add medicine from prescription
const addMedicineFromPrescription = async (req, res) => {
  try {
    const { prescriptionId, medicines } = req.body;
    const { patientId } = req.params;

    const createdMedicines = [];

    for (const medicineData of medicines) {
      const medicine = await Medicine.create({
        patientId: parseInt(patientId),
        prescriptionId,
        medicineName: medicineData.name,
        dosage: medicineData.dosage,
        frequency: medicineData.frequency,
        duration: medicineData.duration,
        instructions: medicineData.instructions,
        startDate: new Date(),
        endDate: medicineData.duration ? calculateEndDate(medicineData.duration) : null,
        isActive: true,
        doctorId: medicineData.doctorId
      });

      // Create default reminders based on frequency
      if (medicineData.frequency) {
        const reminders = createRemindersFromFrequency(medicine.frequency, medicine.id, patientId);
        await MedicineReminder.bulkCreate(reminders);
      }

      createdMedicines.push(medicine);
    }

    res.json({
      success: true,
      message: 'Medicines added successfully',
      data: createdMedicines
    });
  } catch (error) {
    console.error('Error adding medicines from prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding medicines',
      error: error.message
    });
  }
};

// Add manual medicine
const addManualMedicine = async (req, res) => {
  try {
    const { patientId } = req.params;
    const medicineData = req.body;

    const medicine = await Medicine.create({
      patientId: parseInt(patientId),
      medicineName: medicineData.name,
      dosage: medicineData.dosage,
      frequency: medicineData.frequency,
      duration: medicineData.duration,
      instructions: medicineData.instructions,
      startDate: medicineData.startDate || new Date(),
      endDate: medicineData.endDate || (medicineData.duration ? calculateEndDate(medicineData.duration) : null),
      isActive: true,
      doctorId: medicineData.doctorId
    });

    // Create reminders if frequency is provided
    if (medicineData.frequency && medicineData.reminderTimes) {
      const reminders = medicineData.reminderTimes.map(time => ({
        medicineId: medicine.id,
        patientId: parseInt(patientId),
        time: time.time,
        dayOfWeek: time.dayOfWeek || 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder(time.time, time.dayOfWeek || 'all')
      }));

      await MedicineReminder.bulkCreate(reminders);
    }

    res.json({
      success: true,
      message: 'Medicine added successfully',
      data: medicine
    });
  } catch (error) {
    console.error('Error adding manual medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding medicine',
      error: error.message
    });
  }
};

// Record medicine dosage
const recordDosage = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { quantity = 1, notes, takenAt } = req.body;

    const medicine = await Medicine.findByPk(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Check if medicine is still active
    if (!medicine.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot record dosage for inactive medicine'
      });
    }

    const dosage = await MedicineDosage.create({
      medicineId: parseInt(medicineId),
      patientId: medicine.patientId,
      takenAt: takenAt ? new Date(takenAt) : new Date(),
      quantity: parseInt(quantity),
      dosage: medicine.dosage,
      notes: notes || '',
      status: 'taken'
    });

    res.json({
      success: true,
      message: 'Dosage recorded successfully',
      data: dosage
    });
  } catch (error) {
    console.error('Error recording dosage:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording dosage',
      error: error.message
    });
  }
};

// Update medicine
const updateMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const updateData = req.body;

    const medicine = await Medicine.findByPk(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    await medicine.update(updateData);

    res.json({
      success: true,
      message: 'Medicine updated successfully',
      data: medicine
    });
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating medicine',
      error: error.message
    });
  }
};

// Delete medicine
const deleteMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;

    const medicine = await Medicine.findByPk(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Deactivate reminders
    await MedicineReminder.update(
      { isActive: false },
      { where: { medicineId } }
    );

    // Mark medicine as inactive instead of deleting
    await medicine.update({ isActive: false });

    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting medicine',
      error: error.message
    });
  }
};

// Get medicine reminders
const getMedicineReminders = async (req, res) => {
  try {
    const { patientId } = req.params;

    const reminders = await MedicineReminder.findAll({
      where: {
        patientId: parseInt(patientId),
        isActive: true
      },
      include: [
        {
          model: Medicine,
          as: 'medicine',
          where: { isActive: true }
        }
      ],
      order: [['reminderTime', 'ASC']]
    });

    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reminders',
      error: error.message
    });
  }
};

// Update reminder
const updateReminder = async (req, res) => {
  try {
    const { reminderId } = req.params;
    const updateData = req.body;

    const reminder = await MedicineReminder.findByPk(reminderId);
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    // Recalculate next reminder if time or day changed
    if (updateData.time || updateData.dayOfWeek) {
      updateData.nextReminderAt = calculateNextReminder(
        updateData.time || reminder.time,
        updateData.dayOfWeek || reminder.dayOfWeek
      );
    }

    await reminder.update(updateData);

    res.json({
      success: true,
      message: 'Reminder updated successfully',
      data: reminder
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating reminder',
      error: error.message
    });
  }
};

// Get medicine statistics
const getMedicineStats = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Auto-complete expired medicines before fetching stats
    await autoCompleteExpiredMedicines();

    // Get all medicines for this patient
    const medicines = await Medicine.findAll({
      where: {
        patientId: parseInt(patientId)
      },
      include: [
        {
          model: Doctor,
          as: 'doctor',
          include: [{
            model: require('../models').User,
            as: 'user',
            attributes: ['firstName', 'lastName']
          }]
        },
        {
          model: MedicineDosage,
          as: 'dosages'
        },
        {
          model: MedicineReminder,
          as: 'reminders'
        }
      ],
      order: [['startDate', 'DESC']]
    });

    // Calculate statistics
    const totalMedicines = medicines.length;
    const activeMedicines = medicines.filter(m => m.isActive && (!m.endDate || new Date(m.endDate) > new Date())).length;
    const completedMedicines = medicines.filter(m => m.endDate && new Date(m.endDate) <= new Date()).length;
    
    // Calculate average adherence
    let totalAdherence = 0;
    let medicinesWithAdherence = 0;
    
    medicines.forEach(medicine => {
      const adherence = calculateAdherencePercentage(medicine);
      if (adherence > 0) {
        totalAdherence += adherence;
        medicinesWithAdherence++;
      }
    });
    
    const averageAdherence = medicinesWithAdherence > 0 ? Math.round(totalAdherence / medicinesWithAdherence) : 0;

    // Map medicineName to name for frontend compatibility
    const mappedMedicines = medicines.map(medicine => ({
      ...medicine.toJSON(),
      name: medicine.medicineName
    }));

    res.json({
      success: true,
      data: {
        totalMedicines,
        activeMedicines,
        completedMedicines,
        averageAdherence,
        medicines: mappedMedicines
      }
    });
  } catch (error) {
    console.error('Error fetching medicine stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medicine statistics',
      error: error.message
    });
  }
};

// Helper function to calculate adherence percentage
const calculateAdherencePercentage = (medicine) => {
  if (!medicine.dosages || medicine.dosages.length === 0) {
    return 0;
  }

  let expectedDosages = 0;
  
  if (medicine.endDate) {
    // For completed medicines, calculate based on duration
    const startDate = new Date(medicine.startDate);
    const endDate = new Date(medicine.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // Parse frequency to get daily dosage count
    const frequency = medicine.frequency.toLowerCase();
    let dailyDosages = 1;
    
    if (frequency.includes('twice') || frequency.includes('2 times')) {
      dailyDosages = 2;
    } else if (frequency.includes('three times') || frequency.includes('3 times')) {
      dailyDosages = 3;
    } else if (frequency.includes('four times') || frequency.includes('4 times')) {
      dailyDosages = 4;
    }
    
    expectedDosages = totalDays * dailyDosages;
  } else if (medicine.isActive) {
    // For active medicines, calculate based on days since start
    const startDate = new Date(medicine.startDate);
    const now = new Date();
    const totalDays = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // Parse frequency to get daily dosage count
    const frequency = medicine.frequency.toLowerCase();
    let dailyDosages = 1;
    
    if (frequency.includes('twice') || frequency.includes('2 times')) {
      dailyDosages = 2;
    } else if (frequency.includes('three times') || frequency.includes('3 times')) {
      dailyDosages = 3;
    } else if (frequency.includes('four times') || frequency.includes('4 times')) {
      dailyDosages = 4;
    }
    
    expectedDosages = totalDays * dailyDosages;
  }
  
  const actualDosages = medicine.dosages.length;
  return Math.min(100, Math.round((actualDosages / Math.max(1, expectedDosages)) * 100));
};

// Helper functions
const calculateEndDate = (duration) => {
  const startDate = new Date();
  
  // If duration is a number, treat it as days
  if (typeof duration === 'number') {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + duration);
    return endDate;
  }
  
  // If duration is a string, parse it (backward compatibility)
  if (typeof duration === 'string') {
    const match = duration.match(/(\d+)\s*(day|week|month|year)s?/i);
    
    if (!match) return null;
    
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    const endDate = new Date(startDate);
    
    switch (unit) {
      case 'day':
        endDate.setDate(startDate.getDate() + amount);
        break;
      case 'week':
        endDate.setDate(startDate.getDate() + (amount * 7));
        break;
      case 'month':
        endDate.setMonth(startDate.getMonth() + amount);
        break;
      case 'year':
        endDate.setFullYear(startDate.getFullYear() + amount);
        break;
    }
    
    return endDate;
  }
  
  return null;
};

const createRemindersFromFrequency = (frequency, medicineId, patientId) => {
  const reminders = [];
  
  // Parse frequency and create appropriate reminders
  if (frequency.includes('daily') || frequency.includes('once a day')) {
    reminders.push({
      medicineId,
      patientId: parseInt(patientId),
      time: '08:00',
      dayOfWeek: 'all',
      isActive: true,
      nextReminderAt: calculateNextReminder('08:00', 'all')
    });
  }
  
  if (frequency.includes('twice') || frequency.includes('2 times')) {
    reminders.push(
      {
        medicineId,
        patientId: parseInt(patientId),
        time: '08:00',
        dayOfWeek: 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder('08:00', 'all')
      },
      {
        medicineId,
        patientId: parseInt(patientId),
        time: '20:00',
        dayOfWeek: 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder('20:00', 'all')
      }
    );
  }
  
  if (frequency.includes('three times') || frequency.includes('3 times')) {
    reminders.push(
      {
        medicineId,
        patientId: parseInt(patientId),
        time: '08:00',
        dayOfWeek: 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder('08:00', 'all')
      },
      {
        medicineId,
        patientId: parseInt(patientId),
        time: '14:00',
        dayOfWeek: 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder('14:00', 'all')
      },
      {
        medicineId,
        patientId: parseInt(patientId),
        time: '20:00',
        dayOfWeek: 'all',
        isActive: true,
        nextReminderAt: calculateNextReminder('20:00', 'all')
      }
    );
  }
  
  return reminders;
};

// Get patient medicines for doctor view
const getPatientMedicinesForDoctor = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status = 'active' } = req.query;

    let whereCondition = { patientId };
    
    if (status === 'active') {
      whereCondition.isActive = true;
      whereCondition[Op.or] = [
        { endDate: null }, // Medicines with no end date (ongoing)
        { endDate: { [Op.gt]: new Date() } } // Medicines that haven't reached end date yet
      ];
    } else if (status === 'completed') {
      whereCondition[Op.or] = [
        { endDate: { [Op.lte]: new Date() } }, // Medicines that have reached end date
        { isActive: false } // Manually deactivated medicines
      ];
    } else if (status === 'inactive') {
      whereCondition.isActive = false;
    }

    const medicines = await Medicine.findAll({
      where: whereCondition,
      include: [
        {
          model: Doctor,
          as: 'doctor',
          include: [{
            model: require('../models').User,
            as: 'user',
            attributes: ['firstName', 'lastName']
          }],
          required: false
        },
        {
          model: Prescription,
          as: 'prescription',
          required: false
        }
      ],
      order: [['startDate', 'DESC']]
    });

    // Map medicineName to name for frontend compatibility
    const mappedMedicines = medicines.map(medicine => ({
      ...medicine.toJSON(),
      name: medicine.medicineName
    }));

    res.json({
      success: true,
      data: mappedMedicines
    });
  } catch (error) {
    console.error('Error fetching patient medicines for doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medicines',
      error: error.message
    });
  }
};

// Discontinue medicine
const discontinueMedicine = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { reason, notes } = req.body;

    const medicine = await Medicine.findByPk(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Update medicine status
    await medicine.update({
      isActive: false,
      endDate: new Date(),
      instructions: medicine.instructions + `\n\nDiscontinued on ${new Date().toLocaleDateString()}${reason ? ` - Reason: ${reason}` : ''}${notes ? ` - Notes: ${notes}` : ''}`
    });

    // Deactivate all reminders for this medicine
    await MedicineReminder.update(
      { isActive: false },
      { where: { medicineId } }
    );

    res.json({
      success: true,
      message: 'Medicine discontinued successfully',
      data: medicine
    });
  } catch (error) {
    console.error('Error discontinuing medicine:', error);
    res.status(500).json({
      success: false,
      message: 'Error discontinuing medicine',
      error: error.message
    });
  }
};

// Get all patients' medicines for doctor (for overview)
const getAllPatientsMedicines = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status = 'active' } = req.query;

    let whereCondition = { doctorId };
    
    if (status === 'active') {
      whereCondition.isActive = true;
      whereCondition[Op.or] = [
        { endDate: null }, // Medicines with no end date (ongoing)
        { endDate: { [Op.gt]: new Date() } } // Medicines that haven't reached end date yet
      ];
    } else if (status === 'completed') {
      whereCondition[Op.or] = [
        { endDate: { [Op.lte]: new Date() } }, // Medicines that have reached end date
        { isActive: false } // Manually deactivated medicines
      ];
    } else if (status === 'inactive') {
      whereCondition.isActive = false;
    }

    const medicines = await Medicine.findAll({
      where: whereCondition,
      include: [
        {
          model: Patient,
          as: 'patient',
          include: [{
            model: require('../models').User,
            as: 'user',
            attributes: ['firstName', 'lastName', 'email']
          }]
        },
        {
          model: Prescription,
          as: 'prescription',
          required: false
        }
      ],
      order: [['startDate', 'DESC']]
    });

    res.json({
      success: true,
      data: medicines
    });
  } catch (error) {
    console.error('Error fetching all patients medicines:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medicines',
      error: error.message
    });
  }
};

// Record medicine dosage (habit tracker)
const recordMedicineDosage = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const { quantity = 1, notes = '', takenAt } = req.body;
    
    // Find the medicine
    const medicine = await Medicine.findByPk(medicineId, {
      include: [
        {
          model: Patient,
          as: 'patient'
        }
      ]
    });
    
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }
    
    // Check if medicine is still active
    if (!medicine.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot record dosage for inactive medicine'
      });
    }
    
    // Create dosage record
    const dosage = await MedicineDosage.create({
      medicineId: parseInt(medicineId),
      patientId: medicine.patientId,
      quantity: parseInt(quantity),
      dosage: medicine.dosage, // Add the dosage field
      notes: notes.trim(),
      takenAt: takenAt ? new Date(takenAt) : new Date()
    });
    
    res.json({
      success: true,
      message: 'Dosage recorded successfully',
      data: { dosage }
    });
    
  } catch (error) {
    console.error('Error recording medicine dosage:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording medicine dosage',
      error: error.message
    });
  }
};

// Get today's medicine schedule for habit tracker
const getTodayMedicineSchedule = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Auto-complete expired medicines first
    await autoCompleteExpiredMedicines();
    
    // Get today's date
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    // Get active medicines for this patient (including end date check)
    const medicines = await Medicine.findAll({
      where: {
        patientId: parseInt(patientId),
        isActive: true,
        [Op.or]: [
          { endDate: null }, // Medicines with no end date (ongoing)
          { endDate: { [Op.gt]: today } } // Medicines that haven't reached end date yet
        ]
      },
      include: [
        {
          model: MedicineReminder,
          as: 'reminders',
          where: { isActive: true },
          required: false
        },
        {
          model: MedicineDosage,
          as: 'dosages',
          where: {
            takenAt: {
              [Op.between]: [todayStart, todayEnd]
            }
          },
          required: false
        },
        {
          model: Doctor,
          as: 'doctor',
          include: [
            {
              model: require('../models').User,
              as: 'user'
            }
          ]
        }
      ]
    });
    
    // Helper function to check if medicine has scheduled frequency
    const hasScheduledFrequency = (frequency) => {
      const freq = frequency.toLowerCase();
      // Exclude medicines with non-scheduled frequencies
      const nonScheduledPatterns = [
        'as directed',
        'as prescribed',
        'prn',
        'when needed',
        'when required',
        'as needed',
        'when necessary',
        'on demand',
        'when pain',
        'for pain',
        'if needed',
        'if required',
        'emergency',
        'as required'
      ];
      
      // Check if frequency matches any non-scheduled pattern
      const isNonScheduled = nonScheduledPatterns.some(pattern => 
        freq.includes(pattern)
      );
      
      // Check if frequency contains scheduled times
      const hasScheduledTimes = freq.includes('morning') || 
                               freq.includes('lunch') || 
                               freq.includes('dinner') || 
                               freq.includes('breakfast') ||
                               freq.includes('evening') ||
                               freq.includes('night') ||
                               freq.includes('bedtime') ||
                               freq.includes('daily') ||
                               freq.includes('twice daily') ||
                               freq.includes('three times daily') ||
                               freq.includes('four times daily') ||
                               freq.includes('every') ||
                               freq.includes('hourly') ||
                               freq.includes('weekly') ||
                               freq.includes('monthly');
      
      return !isNonScheduled && hasScheduledTimes;
    };

    // Format the schedule
    const schedule = medicines.map(medicine => {
      const reminders = medicine.reminders || [];
      const todayDosages = medicine.dosages || [];
      
      // Parse frequency to determine expected dosages
      const frequency = medicine.frequency.toLowerCase();
      const expectedTimes = [];
      
      if (frequency.includes('morning') || frequency.includes('breakfast')) {
        expectedTimes.push({ time: '08:00', label: 'Morning', taken: false });
      }
      if (frequency.includes('lunch')) {
        expectedTimes.push({ time: '12:00', label: 'Lunch', taken: false });
      }
      if (frequency.includes('dinner') || frequency.includes('evening') || frequency.includes('night') || frequency.includes('bedtime')) {
        expectedTimes.push({ time: '19:00', label: 'Dinner', taken: false });
      }
      
      // Check which dosages were taken today
      todayDosages.forEach(dosage => {
        const dosageTime = new Date(dosage.takenAt);
        const hour = dosageTime.getHours();
        
        // Match dosage time to expected time slots
        expectedTimes.forEach(expected => {
          const expectedHour = parseInt(expected.time.split(':')[0]);
          if (Math.abs(hour - expectedHour) <= 2) { // Within 2 hours of expected time
            expected.taken = true;
            expected.dosageId = dosage.id;
            expected.takenAt = dosage.takenAt;
          }
        });
      });
      
      return {
        id: medicine.id,
        name: medicine.medicineName,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        instructions: medicine.instructions,
        doctor: medicine.doctor?.user ? 
          `${medicine.doctor.user.firstName} ${medicine.doctor.user.lastName}` : 
          'Unknown Doctor',
        expectedTimes,
        totalExpected: expectedTimes.length,
        totalTaken: expectedTimes.filter(t => t.taken).length,
        adherence: expectedTimes.length > 0 ? 
          Math.round((expectedTimes.filter(t => t.taken).length / expectedTimes.length) * 100) : 0,
        hasScheduledFrequency: hasScheduledFrequency(medicine.frequency)
      };
    }).filter(medicine => {
      // Only include medicines with scheduled times AND valid scheduled frequency
      return medicine.expectedTimes.length > 0 && medicine.hasScheduledFrequency;
    });
    
    console.log(`🔍 DEBUG: Today's schedule - Found ${medicines.length} active medicines, ${schedule.length} with scheduled times`);
    
    res.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        schedule,
        totalMedicines: schedule.length,
        totalDoses: schedule.reduce((sum, med) => sum + med.totalExpected, 0),
        takenDoses: schedule.reduce((sum, med) => sum + med.totalTaken, 0),
        overallAdherence: schedule.length > 0 ? 
          Math.round(schedule.reduce((sum, med) => sum + med.adherence, 0) / schedule.length) : 0
      }
    });
    
  } catch (error) {
    console.error('Error getting today medicine schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting medicine schedule',
      error: error.message
    });
  }
};

// Get medicine schedule for a date range (for matrix view)
const getMedicineScheduleRange = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Auto-complete expired medicines first
    await autoCompleteExpiredMedicines();
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day
    
    // Get medicines that were active during the date range
    const medicines = await Medicine.findAll({
      where: {
        patientId: parseInt(patientId),
        isActive: true,
        // Only show medicines that were active during the selected date range
        [Op.or]: [
          // Medicines with no end date (ongoing)
          { endDate: null },
          // Medicines that started before or during the range and end after the range starts
          {
            startDate: { [Op.lte]: end },
            endDate: { [Op.gte]: start }
          }
        ]
      },
      include: [
        {
          model: Doctor,
          as: 'doctor',
          include: [
            {
              model: require('../models').User,
              as: 'user'
            }
          ]
        }
      ]
    });
    
    // Get dosages for the date range
    const dosages = await MedicineDosage.findAll({
      where: {
        patientId: parseInt(patientId),
        takenAt: {
          [Op.between]: [start, end]
        }
      }
    });
    
    // Helper function to check if medicine has scheduled frequency
    const hasScheduledFrequency = (frequency) => {
      const freq = frequency.toLowerCase();
      // Exclude medicines with non-scheduled frequencies
      const nonScheduledPatterns = [
        'as directed',
        'as prescribed',
        'prn',
        'when needed',
        'when required',
        'as needed',
        'when necessary',
        'on demand',
        'when pain',
        'for pain',
        'if needed',
        'if required',
        'emergency',
        'as required'
      ];
      
      // Check if frequency matches any non-scheduled pattern
      const isNonScheduled = nonScheduledPatterns.some(pattern => 
        freq.includes(pattern)
      );
      
      // Check if frequency contains scheduled times
      const hasScheduledTimes = freq.includes('morning') || 
                               freq.includes('lunch') || 
                               freq.includes('dinner') || 
                               freq.includes('breakfast') ||
                               freq.includes('evening') ||
                               freq.includes('night') ||
                               freq.includes('bedtime') ||
                               freq.includes('daily') ||
                               freq.includes('twice daily') ||
                               freq.includes('three times daily') ||
                               freq.includes('four times daily') ||
                               freq.includes('every') ||
                               freq.includes('hourly') ||
                               freq.includes('weekly') ||
                               freq.includes('monthly');
      
      return !isNonScheduled && hasScheduledTimes;
    };

    // Format the medicines with expected times and filter out those without scheduled times
    const formattedMedicines = medicines.map(medicine => {
      const frequency = medicine.frequency.toLowerCase();
      const expectedTimes = [];
      
      if (frequency.includes('morning') || frequency.includes('breakfast')) {
        expectedTimes.push({ time: '08:00', label: 'Morning' });
      }
      if (frequency.includes('lunch')) {
        expectedTimes.push({ time: '12:00', label: 'Lunch' });
      }
      if (frequency.includes('dinner') || frequency.includes('evening') || frequency.includes('night') || frequency.includes('bedtime')) {
        expectedTimes.push({ time: '19:00', label: 'Dinner' });
      }
      
      return {
        id: medicine.id,
        name: medicine.medicineName,
        dosage: medicine.dosage,
        frequency: medicine.frequency,
        instructions: medicine.instructions,
        startDate: medicine.startDate,
        endDate: medicine.endDate,
        doctor: medicine.doctor?.user ? 
          `${medicine.doctor.user.firstName} ${medicine.doctor.user.lastName}` : 
          'Unknown Doctor',
        expectedTimes,
        hasScheduledFrequency: hasScheduledFrequency(medicine.frequency)
      };
    }).filter(medicine => {
      // Only include medicines with scheduled times AND valid scheduled frequency
      return medicine.expectedTimes.length > 0 && medicine.hasScheduledFrequency;
    });
    
    // Log filtered medicines for debugging
    const excludedMedicines = medicines.filter(medicine => {
      const frequency = medicine.frequency.toLowerCase();
      const expectedTimes = [];
      
      if (frequency.includes('morning') || frequency.includes('breakfast')) {
        expectedTimes.push({ time: '08:00', label: 'Morning' });
      }
      if (frequency.includes('lunch')) {
        expectedTimes.push({ time: '12:00', label: 'Lunch' });
      }
      if (frequency.includes('dinner') || frequency.includes('evening') || frequency.includes('night') || frequency.includes('bedtime')) {
        expectedTimes.push({ time: '19:00', label: 'Dinner' });
      }
      
      const hasScheduled = hasScheduledFrequency(medicine.frequency);
      return !(expectedTimes.length > 0 && hasScheduled);
    });

    console.log(`🔍 DEBUG: Found ${medicines.length} active medicines, ${formattedMedicines.length} with scheduled times`);
    console.log('🔍 DEBUG: Medicines with scheduled times:', formattedMedicines.map(m => ({ name: m.name, frequency: m.frequency, expectedTimes: m.expectedTimes.length })));
    console.log('🔍 DEBUG: Excluded medicines (no scheduled times):', excludedMedicines.map(m => ({ name: m.medicineName, frequency: m.frequency })));
    
    res.json({
      success: true,
      data: {
        medicines: formattedMedicines,
        dosages: dosages.map(dosage => ({
          id: dosage.id,
          medicineId: dosage.medicineId,
          takenAt: dosage.takenAt,
          quantity: dosage.quantity,
          notes: dosage.notes
        })),
        dateRange: {
          startDate,
          endDate
        }
      }
    });
    
  } catch (error) {
    console.error('Error getting medicine schedule range:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting medicine schedule',
      error: error.message
    });
  }
};

// Get reminder settings for a patient
const getReminderSettings = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    console.log('Fetching reminder settings for patient:', patientId);
    console.log('Authenticated user:', req.user);
    console.log('User patient ID:', req.user.patientId);
    console.log('User role:', req.user.role);
    
    // Check if user has permission to access this patient's data
    if (req.user.role === 'patient' && req.user.patientId !== parseInt(patientId)) {
      console.log('Permission denied: Patient can only access their own data');
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own reminder settings.'
      });
    }
    
    // Try to find existing settings
    let settings = await PatientReminderSettings.findOne({
      where: { patientId: parseInt(patientId) }
    });
    
    // If no settings exist, create default ones
    if (!settings) {
      console.log('No existing settings found, creating default settings for patient:', patientId);
      settings = await PatientReminderSettings.create({
        patientId: parseInt(patientId),
        morningTime: '08:00',
        lunchTime: '12:00',
        dinnerTime: '19:00',
        enabled: true,
        notificationEnabled: true,
        reminderMinutesBefore: 15
      });
    }
    
    console.log('Returning reminder settings:', settings.toJSON());
    
    res.json({
      success: true,
      data: settings.toJSON()
    });
  } catch (error) {
    console.error('Error fetching reminder settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reminder settings',
      error: error.message
    });
  }
};

// Save reminder settings for a patient
const saveReminderSettings = async (req, res) => {
  try {
    const { patientId } = req.params;
    const settings = req.body;
    
    console.log('=== SAVE REMINDER SETTINGS REQUEST ===');
    console.log('Patient ID:', patientId);
    console.log('Request body:', settings);
    console.log('Request headers:', req.headers);
    console.log('Auth token present:', !!req.headers.authorization);
    console.log('Settings data:', JSON.stringify(settings, null, 2));
    console.log('Authenticated user:', req.user);
    console.log('User patient ID:', req.user.patientId);
    console.log('User role:', req.user.role);
    
    // Check if user has permission to access this patient's data
    if (req.user.role === 'patient' && req.user.patientId !== parseInt(patientId)) {
      console.log('Permission denied: Patient can only access their own data');
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own reminder settings.'
      });
    }

    // Validate input data
    if (!settings.morningTime || !settings.lunchTime || !settings.dinnerTime) {
      return res.status(400).json({
        success: false,
        message: 'All reminder times are required'
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(settings.morningTime) || 
        !timeRegex.test(settings.lunchTime) || 
        !timeRegex.test(settings.dinnerTime)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time format. Please use HH:MM format.'
      });
    }

    // Validate reminder minutes
    if (settings.reminderMinutesBefore && (settings.reminderMinutesBefore < 1 || settings.reminderMinutesBefore > 120)) {
      return res.status(400).json({
        success: false,
        message: 'Reminder minutes must be between 1 and 120'
      });
    }
    
    // First, try to find existing settings
    let existingSettings = await PatientReminderSettings.findOne({
      where: { patientId: parseInt(patientId) }
    });
    
    let savedSettings;
    
    if (existingSettings) {
      // Update existing settings
      console.log('Updating existing settings...');
      await existingSettings.update({
        morningTime: settings.morningTime || '08:00',
        lunchTime: settings.lunchTime || '12:00',
        dinnerTime: settings.dinnerTime || '19:00',
        enabled: settings.enabled !== undefined ? settings.enabled : true,
        notificationEnabled: settings.notificationEnabled !== undefined ? settings.notificationEnabled : true,
        reminderMinutesBefore: settings.reminderMinutesBefore || 15
      });
      savedSettings = existingSettings;
      console.log('Settings updated successfully');
    } else {
      // Create new settings
      console.log('Creating new settings...');
      savedSettings = await PatientReminderSettings.create({
        patientId: parseInt(patientId),
        morningTime: settings.morningTime || '08:00',
        lunchTime: settings.lunchTime || '12:00',
        dinnerTime: settings.dinnerTime || '19:00',
        enabled: settings.enabled !== undefined ? settings.enabled : true,
        notificationEnabled: settings.notificationEnabled !== undefined ? settings.notificationEnabled : true,
        reminderMinutesBefore: settings.reminderMinutesBefore || 15
      });
      console.log('Settings created successfully');
    }
    
    console.log('Final saved settings:', savedSettings.toJSON());
    
    res.json({
      success: true,
      message: 'Reminder settings saved successfully',
      data: savedSettings.toJSON()
    });
  } catch (error) {
    console.error('Error saving reminder settings:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Error saving reminder settings',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Test reminder notification
const testReminderNotification = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    console.log('Test notification requested for patient:', patientId);
    
    // In a real app, you would:
    // 1. Send a browser notification
    // 2. Send a push notification
    // 3. Send an email/SMS
    // 4. Log the test notification
    
    res.json({
      success: true,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test notification',
      error: error.message
    });
  }
};

module.exports = {
  getPatientMedicines,
  addMedicineFromPrescription,
  addManualMedicine,
  recordDosage,
  recordMedicineDosage,
  updateMedicine,
  deleteMedicine,
  getMedicineReminders,
  updateReminder,
  getMedicineStats,
  getPatientMedicinesForDoctor,
  discontinueMedicine,
  getAllPatientsMedicines,
  getTodayMedicineSchedule,
  getMedicineScheduleRange,
  autoCompleteExpiredMedicines,
  getReminderSettings,
  saveReminderSettings,
  testReminderNotification
};
