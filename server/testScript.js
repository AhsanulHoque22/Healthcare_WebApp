require('dotenv').config();
const { Patient, User, DocumentCache } = require('./models');
const clinicalService = require('./services/clinicalService');

async function test() {
  const allUsers = await User.findAll();
  const targetUser = allUsers.find(u => (u.firstName + ' ' + u.lastName).toLowerCase().includes('mozammel'));

  if (!targetUser) {
    console.log('User not found!');
    process.exit(1);
  }

  console.log('Found user:', targetUser.id, targetUser.firstName, targetUser.lastName);
  
  const patient = await Patient.findOne({ where: { userId: targetUser.id } });
  if (!patient) {
    console.log('Patient not found for user');
    process.exit(1);
  }

  console.log('Patient ID:', patient.id);
  console.log('Medical Docs in DB:', (patient.medicalDocuments || []).length);

  console.log('--- Calling getUnifiedMedicalSummary (reanalyze=false) ---');
  const summary = await clinicalService.getUnifiedMedicalSummary(patient.id, false);
  console.log('CacheMeta:', summary.cacheMeta);
  console.log('Summary Diagnoses:', summary.summarizedDiagnoses.length);
  console.log('Summary Labs:', summary.recentLabResults.length);
  
  // also check DocumentCache for errors
  const urlHashes = (patient.medicalDocuments || []).map(d => require('crypto').createHash('sha256').update(d.url).digest('hex'));
  const caches = await DocumentCache.findAll({ where: { urlHash: urlHashes } });
  console.log('Caches found:', caches.length);
  caches.forEach(c => {
    console.log('Cache', c.id, 'error?', c.extractedData && c.extractedData.error ? 'YES' : 'NO');
  });
}
test().catch(console.error);
