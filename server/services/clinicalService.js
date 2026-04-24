/**
 * clinicalService.js
 * 
 * Centralized clinical intelligence and reconciliation engine.
 * Synchronizes medical summaries between the UI and the AI Chatbot.
 */

const { 
  Patient, Prescription, LabTestOrder, LabTest, DocumentCache, Medicine 
} = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const extractionService = require('./extractionService');
const {
  LLAMA_MODELS,
  MODEL_VERSIONS,
  hasGroqApiKey,
  createChatCompletion,
  requestStructuredJson,
  isLegacyGeminiModelVersion
} = require('./groqLlamaService');

const SUMMARY_MODEL_VERSION = MODEL_VERSIONS.patientInsight;
const RECONCILIATION_MODEL_VERSION = MODEL_VERSIONS.documentExtraction;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const parseFlexibleArray = (value, mapper) => {
  if (!value) return [];
  let parsedValue = value;
  if (typeof value === 'string') {
    try {
      parsedValue = (value.startsWith('[') || value.startsWith('{')) ? JSON.parse(value) : value;
    } catch (e) { parsedValue = value; }
  }
  if (Array.isArray(parsedValue)) return mapper ? parsedValue.map(mapper).filter(Boolean) : parsedValue;
  return mapper ? [mapper(parsedValue)].filter(Boolean) : [parsedValue];
};

const normalizeUiStatus = (status) => {
  const norm = String(status || '').toLowerCase();
  if (['critical', 'abnormal', 'high', 'low', 'urgent'].includes(norm)) return norm === 'critical' ? 'Critical' : 'Caution';
  if (['normal', 'stable', 'resolved'].includes(norm)) return 'Normal';
  if (norm === 'caution') return 'Caution';
  return 'Normal';
};

const getOverallInsightStatus = (findings = []) => {
  if (findings.some(f => normalizeUiStatus(f.status) === 'Critical')) return 'Critical';
  if (findings.some(f => normalizeUiStatus(f.status) === 'Caution')) return 'Caution';
  return 'Normal';
};

const dedupeMedications = (medications = []) => {
  const seen = new Set();
  return medications.filter(m => {
    const key = `${String(m?.name || '').toLowerCase()}::${String(m?.dosage || '').toLowerCase()}`;
    if (!m?.name || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const buildLabResultsSummary = (labReports = []) => {
  const flattened = labReports.flatMap(r => (r.findings || []).map(f => ({
    test: f?.test || 'Result',
    value: f?.value ?? '',
    unit: f?.unit || '',
    status: normalizeUiStatus(f?.status),
    rawStatus: f?.status || 'unknown',
    referenceRange: f?.referenceRange || '',
    date: r?.date || null,
    source: r?.source || 'Lab report',
    reportName: r?.testNames || r?.orderId || 'Lab Report'
  })));

  return {
    totalReports: labReports.length,
    totalFindings: flattened.length,
    criticalCount: flattened.filter(f => f.status === 'Critical').length,
    cautionCount: flattened.filter(f => f.status === 'Caution').length,
    normalCount: flattened.filter(f => f.status === 'Normal').length,
    highlightedFindings: flattened.sort((a,b) => {
      const rank = { Critical: 0, Caution: 1, Normal: 2 };
      const diff = (rank[a.status]??3) - (rank[b.status]??3);
      return diff !== 0 ? diff : new Date(b.date||0).getTime() - new Date(a.date||0).getTime();
    }).slice(0, 12)
  };
};

const parseReportFiles = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    try {
      const p = JSON.parse(val);
      if (Array.isArray(p)) return p.filter(Boolean);
    } catch (e) {
      if (/^https?:\/\//i.test(val)) return [{ url: val, path: val, originalName: 'Lab Report' }];
    }
  }
  return [];
};

const extractPrescriptionTestArtifacts = (testsValue) => {
  const parsed = parseFlexibleArray(testsValue, t => t).filter(Boolean);
  const artifacts = [];
  parsed.forEach(t => {
    if (typeof t !== 'object' || !t) return;
    const reports = parseReportFiles(t.testReports);
    reports.forEach(r => {
      const url = r.url || r.path;
      if (!url) return;
      artifacts.push({
        url, source: 'Prescription Report',
        name: r.originalName || r.filename || `${t.name || 'Prescription'} Report`,
        date: r.uploadedAt || t.approvedAt || t.createdAt || null,
        orderId: t.sampleId || t.id || null,
        testNames: t.name || 'Prescription Lab Report'
      });
    });
  });
  return artifacts;
};

// ─── AI REASONING ────────────────────────────────────────────────────────────

const buildFallbackClinicalInsight = ({ diagnoses, medications, labResults }) => {
  const flattenedLabs = labResults.flatMap(l => l.findings || []);
  const keyFindings = flattenedLabs.slice(0, 5).map(f => ({
    title: f.test || 'Lab result', status: normalizeUiStatus(f.status),
    reason: `${f.value || 'N/A'} ${f.unit || ''}`.trim(), source: 'Laboratory data', date: null
  }));
  const overallStatus = getOverallInsightStatus(keyFindings);

  return {
    overallStatus,
    summary: overallStatus === 'Normal' ? 'Records broadly stable.' : 'Findings need review.',
    improved: [], worsened: keyFindings.filter(f => f.status !== 'Normal').map(f => f.title),
    stable: diagnoses.slice(0, 3).map(d => d.condition || d.diagnosis).filter(Boolean),
    activeMedications: dedupeMedications(medications).slice(0, 10),
    keyFindings, followUpConsiderations: []
  };
};

const generateFastPatientNarrative = async ({ patient, diagnoses, symptoms, medications, labCount }) => {
  if (!hasGroqApiKey()) return 'AI Summary unavailable.';
  const prompt = `Write a 2-3 sentence clinical narrative. Patient snapshot: ${JSON.stringify({age: patient.user?.dateOfBirth, chronicConditions: patient.chronicConditions, allergies: patient.allergies})} Diagnoses: ${JSON.stringify(diagnoses.slice(0, 5))} Symptoms: ${JSON.stringify(symptoms.slice(0, 5))} Medications: ${JSON.stringify(medications.slice(0, 8))} Lab count: ${labCount}`;
  return createChatCompletion({
    model: LLAMA_MODELS.patientInsight, messages: [{role: 'system', content: 'You are a professional medical scribe.'}, {role: 'user', content: prompt}],
    temperature: 0.1, maxTokens: 180, timeoutMs: 12000, fallbackModel: LLAMA_MODELS.patientInsightSmall
  });
};

const generateClinicalReconciliation = async ({ patient, diagnoses, symptoms, medications, labResults, documentEvidence }) => {
  if (!hasGroqApiKey()) return buildFallbackClinicalInsight({ diagnoses, medications, labResults });
  const prompt = `Reconcile medical records. 
  Patient profile: ${JSON.stringify({chronicConditions: patient.chronicConditions, allergies: patient.allergies})}
  Diagnoses: ${JSON.stringify(diagnoses.slice(0, 12))}
  Symptoms: ${JSON.stringify(symptoms.slice(0, 12))}
  Medication candidates: ${JSON.stringify(medications.slice(0, 15))}
  Lab report findings: ${JSON.stringify(labResults.slice(0, 8))}
  Document evidence: ${JSON.stringify(documentEvidence.slice(0, 8))}`;

  const insight = await requestStructuredJson({
    name: 'clinical_reconciliation',
    model: LLAMA_MODELS.documentExtraction,
    systemPrompt: 'You are a careful clinical reconciliation engine. Return JSON only.',
    userPrompt: prompt,
    temperature: 0.1, maxTokens: 2200, timeoutMs: 25000, fallbackModel: LLAMA_MODELS.documentExtractionSmall
  });

  const normalizedKeyFindings = Array.isArray(insight?.keyFindings) ? insight.keyFindings.map(f => ({
    title: f?.title || 'Clinical finding', status: normalizeUiStatus(f?.status), reason: f?.reason || '', source: f?.source || 'Clinical reconciliation', date: f?.date || null
  })) : [];

  return {
    overallStatus: insight?.overallStatus || getOverallInsightStatus(normalizedKeyFindings),
    summary: insight?.summary || 'Concise summary not returned.',
    improved: Array.isArray(insight?.improved) ? insight.improved : [],
    worsened: Array.isArray(insight?.worsened) ? insight.worsened : [],
    stable: Array.isArray(insight?.stable) ? insight.stable : [],
    activeMedications: dedupeMedications(Array.isArray(insight?.activeMedications) ? insight.activeMedications : medications).slice(0, 10),
    keyFindings: normalizedKeyFindings,
    followUpConsiderations: Array.isArray(insight?.followUpConsiderations) ? insight.followUpConsiderations : []
  };
};

// ─── MAIN SERVICE ────────────────────────────────────────────────────────────

const getUnifiedMedicalSummary = async (patientId, reanalyze = false) => {
  // 1. Fetch Patient
  const patient = await Patient.findByPk(patientId, {
    include: [{ association: 'user', attributes: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone'] }]
  });
  if (!patient) throw new Error('Patient not found');

  // 2. Fetch Prescriptions
  const latestPrescriptions = await Prescription.findAll({
    where: { patientId }, order: [['createdAt', 'DESC']], limit: 8,
    include: [{ association: 'doctor', include: [{ association: 'user', attributes: ['firstName', 'lastName'] }] }]
  });

  const prescriptionsWithReports = await Prescription.findAll({
    where: { patientId }, attributes: ['id', 'appointmentId', 'createdAt', 'testReports', 'tests'], order: [['createdAt', 'DESC']]
  });

  let summarizedDiagnoses = [];
  let recentSymptoms = [];
  let recentMedications = [];

  latestPrescriptions.forEach(p => {
    if (p.diagnosis) {
      summarizedDiagnoses.push(...parseFlexibleArray(p.diagnosis, d => 
        (typeof d === 'string' ? { condition: d } : { ...d, condition: d?.condition || d?.description })
      ).map(d => ({ ...d, date: p.createdAt, source: 'Prescription' })));
    }
    if (p.symptoms) {
      recentSymptoms.push(...parseFlexibleArray(p.symptoms, s => 
        (typeof s === 'string' ? { symptom: s } : { ...s, symptom: s?.symptom || s?.description })
      ).map(s => ({ ...s, date: p.createdAt, source: 'Prescription' })));
    }
  });

  // 3. Fetch Active Medications from the central 'medicines' table
  // This ensures parity with the Medicine Tracker UI and captures manual additions.
  const activeMeds = await Medicine.findAll({
    where: { patientId, isActive: true },
    order: [['createdAt', 'DESC']]
  });

  recentMedications = activeMeds.map(m => ({
    name: m.medicineName,
    dosage: m.dosage,
    frequency: m.frequency,
    instructions: m.instructions,
    source: m.prescriptionId ? 'Prescription' : 'Manual Entry',
    status: 'active'
  }));

  // 3. Document Collection
  let allMedicalDocuments = [];
  const allLabOrders = await LabTestOrder.findAll({
    where: { patientId, [Op.or]: [{ status: { [Op.in]: ['completed', 'results_ready', 'reported', 'confirmed'] } }, { testReports: { [Op.ne]: null } }, { resultUrl: { [Op.ne]: null } }] },
    order: [['createdAt', 'DESC']]
  });

  for (const order of allLabOrders) {
    const reports = [...parseReportFiles(order.testReports), ...parseReportFiles(order.resultUrl)];
    const testIds = order.testIds || [];
    const tests = await LabTest.findAll({ where: { id: testIds }, attributes: ['name'] });
    const testNames = tests.map(t => t.name).join(', ') || 'Lab Investigation';
    reports.forEach(r => {
      if (r.url || r.path) allMedicalDocuments.push({ url: r.url || r.path, source: 'Lab Order', orderId: order.orderNumber, date: order.createdAt, testNames });
    });
  }

  prescriptionsWithReports.forEach(prescription => {
    const reports = parseReportFiles(prescription.testReports);
    const prescribedTests = parseFlexibleArray(prescription.tests, t => typeof t === 'string' ? t : (t?.name || t?.description || '')).filter(Boolean);
    reports.forEach(report => {
      const url = report.url || report.path;
      if (url) allMedicalDocuments.push({ url, source: 'Prescription Report', name: report.originalName || report.filename || 'Prescription Test Report', date: report.uploadedAt || prescription.createdAt, orderId: `Prescription #${prescription.id}`, testNames: prescribedTests.join(', ') });
    });
    const nested = extractPrescriptionTestArtifacts(prescription.tests);
    nested.forEach(a => allMedicalDocuments.push({ ...a, date: a.date || prescription.createdAt }));
  });

  if (patient.medicalDocuments && Array.isArray(patient.medicalDocuments)) {
    patient.medicalDocuments.forEach(doc => {
      if (doc.url) allMedicalDocuments.push({ url: doc.url, source: 'MedVault', name: doc.name || 'Uploaded Document', date: doc.uploadedAt || doc.createdAt || new Date() });
    });
  }

  // 4. Document Analysis
  let recentLabResults = [];
  let extraDiagnoses = [];
  let documentMedications = [];
  let documentEvidence = [];
  let upgradedCount = 0; let reusableCount = 0; let legacyCount = 0;

  allMedicalDocuments.sort((a,b) => new Date(b.date) - new Date(a.date));
  for (const doc of allMedicalDocuments) {
    try {
      const urlHash = crypto.createHash('sha256').update(doc.url).digest('hex');
      let docCache = await DocumentCache.findOne({ where: { urlHash } });
      const needsUpgrade = docCache && isLegacyGeminiModelVersion(docCache.modelVersion);
      if (needsUpgrade) legacyCount++;

      if (!docCache || !docCache.extractedData || (reanalyze && needsUpgrade)) {
        let data = await extractionService.extractDataFromDocument(doc.url);
        if (data && !data.error) {
          if (!docCache) docCache = await DocumentCache.create({ url: doc.url, urlHash, extractedData: data, modelVersion: data.modelVersion || RECONCILIATION_MODEL_VERSION });
          else {
            await docCache.update({ extractedData: data, modelVersion: data.modelVersion || RECONCILIATION_MODEL_VERSION });
            await docCache.reload();
          }
          if (needsUpgrade) upgradedCount++;
        }
      } else reusableCount++;

      if (docCache && docCache.extractedData) {
        const data = docCache.extractedData;
        if (data.labResults?.length) recentLabResults.push({ orderId: doc.orderId || doc.name || 'Lab Report', date: doc.date, testNames: doc.testNames || data.testNames || data.labResults.map(l => l.test).join(', '), findings: data.labResults, source: doc.source });
        if (data.diagnoses?.length) extraDiagnoses.push(...data.diagnoses.map(d => ({ condition: d.condition, status: d.status, date: doc.date, source: `Extracted from ${doc.source}` })));
        if (data.medications?.length) documentMedications.push(...data.medications.map(m => ({ ...m, source: `Extracted from ${doc.source}`, status: m?.status || 'active' })));
        documentEvidence.push({ documentType: data.documentType || 'other', source: doc.source, date: doc.date, diagnoses: (data.diagnoses || []).slice(0, 4), labResults: (data.labResults || []).slice(0, 6) });
      }
    } catch (e) { console.error("[ClinicalService] Doc error:", e.message); }
  }

  summarizedDiagnoses.push(...extraDiagnoses);
  const reconciledMeds = dedupeMedications([...recentMedications, ...documentMedications]);

  // 5. Narrative & Insights
  const aiClinicalNarrative = await generateFastPatientNarrative({ patient, diagnoses: summarizedDiagnoses, symptoms: recentSymptoms, medications: reconciledMeds, labCount: allLabOrders.length }).catch(e => 'Clinical analysis currently unavailable.');
  const llamaClinicalInsight = await generateClinicalReconciliation({ patient, diagnoses: summarizedDiagnoses, symptoms: recentSymptoms, medications: reconciledMeds, labResults: recentLabResults, documentEvidence }).catch(e => buildFallbackClinicalInsight({ diagnoses: summarizedDiagnoses, medications: reconciledMeds, labResults: recentLabResults }));

  return {
    aiClinicalNarrative,
    llamaClinicalInsight,
    patientInfo: {
      name: `${patient.user.firstName} ${patient.user.lastName}`,
      gender: patient.user.gender,
      dateOfBirth: patient.user.dateOfBirth,
      bloodType: patient.bloodType, height: patient.height, weight: patient.weight, bloodPressure: patient.bloodPressure, pulse: patient.pulse,
      allergies: patient.allergies, chronicConditions: patient.chronicConditions, lastProfileUpdate: patient.updatedAt
    },
    summarizedDiagnoses: summarizedDiagnoses.slice(0, 10),
    recentSymptoms: recentSymptoms.slice(0, 10),
    recentMedications: reconciledMeds,
    recentLabResults: recentLabResults,
    allLabResultsSummary: buildLabResultsSummary(recentLabResults),
    cacheMeta: { analyzedDocuments: allMedicalDocuments.length, reusableCount, legacyCount, upgradedCount }
  };
};

module.exports = {
  getUnifiedMedicalSummary,
  parseFlexibleArray,
  normalizeUiStatus,
  dedupeMedications,
  buildLabResultsSummary
};
