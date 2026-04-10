const {
  Patient, Appointment, Prescription, Medicine, LabTestOrder, MedicalRecord
} = require('../../models');
const { getParsedMedicalData } = require('../documentPipeline');

async function aggregateMedicalData(userId) {
  // 1. Fetch Structured Data
  const patient = await Patient.findOne({
    where: { userId },
    include: [{ association: 'user', attributes: ['firstName', 'lastName', 'gender', 'dateOfBirth'] }]
  });
  
  if (!patient) return { error: true, message: "Patient profile not found." };

  const appointments = await Appointment.findAll({
    where: { patientId: patient.id },
    include: [{ association: 'doctor', include: [{ association: 'user', attributes: ['firstName', 'lastName'] }] }]
  });

  const prescriptions = await Prescription.findAll({
    where: { patientId: patient.id },
    include: [{ association: 'doctor', include: [{ association: 'user', attributes: ['firstName', 'lastName'] }] }]
  });

  const labTestOrders = await LabTestOrder.findAll({
    where: { patientId: patient.id }
  });

  const medicalRecords = await MedicalRecord.findAll({
    where: { patientId: patient.id }
  });

  const activeMedicines = await Medicine.findAll({
    where: { patientId: patient.id, isActive: true }
  });

  // 2 & 3. Retrieve and Extract Unstructured Data via Automated Pipeline
  const extractedDocuments = await getParsedMedicalData(userId);

  // 4. Merge and return to LLM context
  const missingData = [];
  if (appointments.length === 0) missingData.push("No upcoming or previous appointments");
  if (prescriptions.length === 0) missingData.push("No prescriptions on file");
  if (labTestOrders.length === 0) missingData.push("No lab test orders found");
  if (extractedDocuments.length === 0) missingData.push("No uploaded documents or reports found");

  return {
    patientProfile: {
      demographics: {
         name: `${patient.user.firstName} ${patient.user.lastName}`,
         age: patient.user.dateOfBirth ? Math.floor((Date.now() - new Date(patient.user.dateOfBirth)) / 31557600000) : 'N/A',
         gender: patient.user.gender,
         bloodType: patient.bloodType || 'Unknown',
         height: patient.height || 'Unknown',
         weight: patient.weight || 'Unknown',
      },
      risks: {
         allergies: patient.allergies || "None documented",
         chronicConditions: patient.chronicConditions || "None recorded",
         smokingStatus: patient.smokingStatus || "Unknown",
         alcoholConsumption: patient.alcoholConsumption || "Unknown"
      }
    },
    databaseRecords: {
      appointments: appointments.map(a => ({ date: a.appointmentDate, reason: a.reason, doctor: a.doctor ? `${a.doctor.user.firstName} ${a.doctor.user.lastName}` : 'N/A' })),
      prescriptions: prescriptions.map(p => ({ date: p.createdAt, diagnosis: p.diagnosis, medicines: p.medicines })),
      labOrders: labTestOrders.map(l => ({ date: l.createdAt, status: l.status, tests: l.testIds })),
      activeMedicines: activeMedicines.map(m => ({ name: m.medicineName, dosage: m.dosage, frequency: m.frequency })),
      historicalRecords: medicalRecords.map(r => ({ date: r.recordDate, type: r.recordType, diagnosis: r.diagnosis, treatment: r.treatment }))
    },
    extractedDataFromFiles: extractedDocuments,
    status: {
      missingData,
      instructionForLLM: "Perform consistency check. If structured data contradicts extracted file data, explicitly flag it to the user. Present summary encompassing A. Patient Overview, B. Recent Activity, C. Lab Results, D. Medications, E. Risks, F. Missing Data."
    }
  };
}

module.exports = { aggregateMedicalData };
