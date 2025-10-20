const express = require('express');
const router = express.Router();
const medicineController = require('../controllers/medicineController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Patient medicine routes
router.get('/patients/:patientId/medicines', authenticateToken, medicineController.getPatientMedicines);
router.post('/patients/:patientId/medicines/manual', authenticateToken, medicineController.addManualMedicine);
router.post('/patients/:patientId/medicines/from-prescription', authenticateToken, medicineController.addMedicineFromPrescription);
router.put('/medicines/:medicineId', authenticateToken, medicineController.updateMedicine);
router.delete('/medicines/:medicineId', authenticateToken, medicineController.deleteMedicine);

// Medicine dosage routes (must come before other medicine routes to avoid conflicts)
router.post('/dosage/:medicineId', authenticateToken, medicineController.recordDosage);
router.post('/:medicineId/take-dose', authenticateToken, medicineController.recordDosage);

// Doctor medicine management routes
router.get('/doctors/:doctorId/patients/medicines', authenticateToken, medicineController.getAllPatientsMedicines);
router.get('/doctors/patients/:patientId/medicines', authenticateToken, medicineController.getPatientMedicinesForDoctor);
router.post('/medicines/:medicineId/discontinue', authenticateToken, medicineController.discontinueMedicine);

// Reminder routes
router.get('/patients/:patientId/reminders', authenticateToken, medicineController.getMedicineReminders);
router.put('/reminders/:reminderId', authenticateToken, medicineController.updateReminder);

// Statistics routes
router.get('/patients/:patientId/stats', authenticateToken, medicineController.getMedicineStats);

// Habit tracker routes
router.get('/patients/:patientId/schedule/today', authenticateToken, medicineController.getTodayMedicineSchedule);
router.get('/patients/:patientId/schedule/range', authenticateToken, medicineController.getMedicineScheduleRange);

// Reminder settings routes
router.get('/patients/:patientId/reminder-settings', authenticateToken, medicineController.getReminderSettings);
router.post('/patients/:patientId/reminder-settings', authenticateToken, medicineController.saveReminderSettings);
router.post('/patients/:patientId/test-reminder', authenticateToken, medicineController.testReminderNotification);

module.exports = router;
