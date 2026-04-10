const { Patient, LabTestOrder, Prescription, MedicalRecord } = require('../../models');

/**
 * Stage: File Retrieval Layer
 * Fetches all document URLs associated with a given userId
 */
async function retrieveUserDocuments(userId) {
  const patient = await Patient.findOne({ where: { userId } });
  if (!patient) return [];

  const labTestOrders = await LabTestOrder.findAll({ where: { patientId: patient.id } });
  const prescriptions = await Prescription.findAll({ where: { patientId: patient.id } });
  const medicalRecords = await MedicalRecord.findAll({ where: { patientId: patient.id } });

  const fileUrls = new Set();
  
  if (patient.medicalDocuments && Array.isArray(patient.medicalDocuments)) {
    patient.medicalDocuments.forEach(doc => { if (doc.url) fileUrls.add(doc.url); else if (typeof doc === 'string') fileUrls.add(doc); });
  }
  
  labTestOrders.forEach(order => {
    if (order.resultUrl) fileUrls.add(order.resultUrl);
    if (order.testReports && Array.isArray(order.testReports)) {
      order.testReports.forEach(r => { if (r.url) fileUrls.add(r.url); else if (typeof r === 'string') fileUrls.add(r); });
    }
  });

  prescriptions.forEach(p => {
    if (p.testReports) {
      try {
        const parsed = JSON.parse(p.testReports);
        if (Array.isArray(parsed)) parsed.forEach(r => { if (r.url) fileUrls.add(r.url); else if (typeof r === 'string') fileUrls.add(r); });
      } catch (e) {
        if (typeof p.testReports === 'string' && p.testReports.startsWith('http')) fileUrls.add(p.testReports);
      }
    }
  });

  medicalRecords.forEach(r => {
    if (r.attachments && Array.isArray(r.attachments)) {
      r.attachments.forEach(a => { if (a.url) fileUrls.add(a.url); else if (typeof a === 'string') fileUrls.add(a); });
    }
  });

  return Array.from(fileUrls);
}

module.exports = { retrieveUserDocuments };
