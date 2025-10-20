const User = require('./User');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Appointment = require('./Appointment');
const MedicalRecord = require('./MedicalRecord');
const Prescription = require('./prescription');
const DoctorRating = require('./DoctorRating');
const LabTest = require('./LabTest');
const LabTestOrder = require('./LabTestOrder');
const LabPayment = require('./LabPayment');
const BkashPayment = require('./BkashPayment');
const Medicine = require('./Medicine');
const MedicineReminder = require('./MedicineReminder');
const MedicineDosage = require('./MedicineDosage');
const PatientReminderSettings = require('./PatientReminderSettings');
const Notification = require('./Notification');

// User associations
User.hasOne(Patient, { foreignKey: 'userId', as: 'patientProfile' });
User.hasOne(Doctor, { foreignKey: 'userId', as: 'doctorProfile' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

// Patient associations
Patient.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Patient.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments' });
Patient.hasMany(MedicalRecord, { foreignKey: 'patientId', as: 'medicalRecords' });
Patient.hasMany(Prescription, { foreignKey: 'patientId', as: 'prescriptions' });
Patient.hasMany(DoctorRating, { foreignKey: 'patientId', as: 'doctorRatings' });
Patient.hasMany(Medicine, { foreignKey: 'patientId', as: 'medicines' });
Patient.hasMany(MedicineReminder, { foreignKey: 'patientId', as: 'medicineReminders' });
Patient.hasMany(MedicineDosage, { foreignKey: 'patientId', as: 'medicineDosages' });
Patient.hasOne(PatientReminderSettings, { foreignKey: 'patientId', as: 'reminderSettings' });

// Doctor associations
Doctor.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Doctor.hasMany(Appointment, { foreignKey: 'doctorId', as: 'appointments' });
Doctor.hasMany(MedicalRecord, { foreignKey: 'doctorId', as: 'medicalRecords' });
Doctor.hasMany(Prescription, { foreignKey: 'doctorId', as: 'prescriptions' });
Doctor.hasMany(DoctorRating, { foreignKey: 'doctorId', as: 'ratings' });
Doctor.hasMany(Medicine, { foreignKey: 'doctorId', as: 'prescribedMedicines' });

// Appointment associations
Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Appointment.hasMany(MedicalRecord, { foreignKey: 'appointmentId', as: 'medicalRecords' });
Appointment.hasOne(Prescription, { foreignKey: 'appointmentId', as: 'prescriptionDetails' });
Appointment.hasOne(DoctorRating, { foreignKey: 'appointmentId', as: 'rating' });

// MedicalRecord associations
MedicalRecord.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
MedicalRecord.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
MedicalRecord.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

// Prescription associations
Prescription.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Prescription.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Prescription.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Prescription.hasMany(Medicine, { foreignKey: 'prescriptionId', as: 'prescribedMedicines' });

// DoctorRating associations
DoctorRating.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
DoctorRating.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
DoctorRating.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

// Lab Test associations
Patient.hasMany(LabTestOrder, { foreignKey: 'patientId', as: 'labOrders' });
Doctor.hasMany(LabTestOrder, { foreignKey: 'doctorId', as: 'labOrders' });
Appointment.hasMany(LabTestOrder, { foreignKey: 'appointmentId', as: 'labOrders' });

// Lab Test Order associations
LabTestOrder.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
LabTestOrder.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
LabTestOrder.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
LabTestOrder.belongsTo(User, { foreignKey: 'verified_by', as: 'verifier' });
LabTestOrder.hasMany(LabPayment, { foreignKey: 'orderId', as: 'payments' });

// Lab Payment associations
LabPayment.belongsTo(LabTestOrder, { foreignKey: 'orderId', as: 'order' });
LabPayment.belongsTo(User, { foreignKey: 'processedBy', as: 'processor' });

// Bkash Payment associations
BkashPayment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
BkashPayment.belongsTo(Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });
BkashPayment.belongsTo(LabTestOrder, { foreignKey: 'labTestOrderId', as: 'labOrder' });

// Medicine associations
Medicine.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Medicine.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Medicine.belongsTo(Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });
Medicine.hasMany(MedicineReminder, { foreignKey: 'medicineId', as: 'reminders' });
Medicine.hasMany(MedicineDosage, { foreignKey: 'medicineId', as: 'dosages' });

// Medicine Reminder associations
MedicineReminder.belongsTo(Medicine, { foreignKey: 'medicineId', as: 'medicine' });
MedicineReminder.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

// Medicine Dosage associations
MedicineDosage.belongsTo(Medicine, { foreignKey: 'medicineId', as: 'medicine' });
MedicineDosage.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

// Patient Reminder Settings associations
PatientReminderSettings.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  User,
  Patient,
  Doctor,
  Appointment,
  MedicalRecord,
  Prescription,
  DoctorRating,
  LabTest,
  LabTestOrder,
  LabPayment,
  BkashPayment,
  Medicine,
  MedicineReminder,
  MedicineDosage,
  PatientReminderSettings,
  Notification
};
