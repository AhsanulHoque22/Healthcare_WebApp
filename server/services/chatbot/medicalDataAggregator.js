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
    include: [{ association: 'doctor', include: [{ association: 'user', attributes: ['firstName', 'lastName'] }] }],
    order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']]
  });

  const prescriptions = await Prescription.findAll({
    where: { patientId: patient.id },
    include: [{ association: 'doctor', include: [{ association: 'user', attributes: ['firstName', 'lastName'] }] }],
    order: [['createdAt', 'DESC']]
  });

  const labTestOrders = await LabTestOrder.findAll({
    where: { patientId: patient.id },
    order: [['createdAt', 'DESC']]
  });

  const medicalRecords = await MedicalRecord.findAll({
    where: { patientId: patient.id },
    order: [['createdAt', 'DESC']]
  });

  const activeMedicines = await Medicine.findAll({
    where: { patientId: patient.id, isActive: true },
    order: [['createdAt', 'DESC']]
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
    patient: {
      demographics: `${patient.user.firstName}, ${patient.user.gender}, ${patient.bloodType || 'Unk'}`,
      info: `Allergies: ${patient.allergies || 'None'}, History: ${patient.chronicConditions || 'None'}`
    },
    records: {
      appointments: appointments.slice(0, 3).map(a => `${a.appointmentDate} (Dr. ${a.doctor?.user?.lastName || '?'})`),
      prescriptions: prescriptions.slice(0, 3).map(p => `${p.createdAt.toISOString().split('T')[0]} (Dr. ${p.doctor?.user?.lastName || '?'}) - ${p.diagnosis || 'No Diagnosis'}`),
      activeMeds: activeMedicines.slice(0, 5).map(m => `${m.medicineName} (${m.dosage})`),
      labs: labTestOrders.slice(0, 3).map(l => `${l.createdAt.toISOString().split('T')[0]} - Status: ${l.status}`)
    },
    summaryOfFiles: extractedDocuments.length > 0 
      ? `Extracted data found in ${extractedDocuments.length} files. Detected metrics: ${[...new Set(extractedDocuments.flatMap(d => (d.labResults || []).map(r => r.testName)))].join(', ') || 'N/A'}`
      : "No file data available.",
    status: { missing: missingData.join(', ') }
  };
}

module.exports = { aggregateMedicalData };
