const { Patient, User, MedicalRecord, Appointment, Prescription, LabTestOrder, LabTest, DocumentCache } = require('../models');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const crypto = require('crypto');
const extractionService = require('../services/extractionService');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const {
  LLAMA_MODELS,
  MODEL_VERSIONS,
  hasGroqApiKey,
  createChatCompletion,
  requestStructuredJson,
  isLegacyGeminiModelVersion
} = require('../services/groqLlamaService');

const SUMMARY_MODEL_VERSION = MODEL_VERSIONS.patientInsight;
const RECONCILIATION_MODEL_VERSION = MODEL_VERSIONS.documentExtraction;

const parseFlexibleArray = (value, mapper) => {
  if (!value) {
    return [];
  }

  let parsedValue = value;

  if (typeof value === 'string') {
    try {
      parsedValue = value.startsWith('[') || value.startsWith('{') ? JSON.parse(value) : value;
    } catch (error) {
      parsedValue = value;
    }
  }

  if (Array.isArray(parsedValue)) {
    return mapper ? parsedValue.map(mapper).filter(Boolean) : parsedValue;
  }

  if (typeof parsedValue === 'string') {
    return mapper ? [mapper(parsedValue)].filter(Boolean) : [parsedValue];
  }

  return mapper ? [mapper(parsedValue)].filter(Boolean) : [parsedValue];
};

const normalizeUiStatus = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (['critical', 'abnormal', 'high', 'low', 'urgent'].includes(normalized)) {
    return normalized === 'critical' ? 'Critical' : 'Caution';
  }

  if (['normal', 'stable', 'resolved'].includes(normalized)) {
    return 'Normal';
  }

  if (normalized === 'caution') {
    return 'Caution';
  }

  return 'Normal';
};

const getOverallInsightStatus = (findings = []) => {
  if (findings.some((finding) => normalizeUiStatus(finding.status) === 'Critical')) {
    return 'Critical';
  }

  if (findings.some((finding) => normalizeUiStatus(finding.status) === 'Caution')) {
    return 'Caution';
  }

  return 'Normal';
};

const dedupeMedications = (medications = []) => {
  const seen = new Set();

  return medications.filter((medication) => {
    const key = `${String(medication?.name || '').toLowerCase()}::${String(medication?.dosage || '').toLowerCase()}`;
    if (!medication?.name || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const buildLabResultsSummary = (labReports = []) => {
  const flattenedFindings = labReports.flatMap((report) =>
    (report.findings || []).map((finding) => ({
      test: finding?.test || 'Result',
      value: finding?.value ?? '',
      unit: finding?.unit || '',
      status: normalizeUiStatus(finding?.status),
      rawStatus: finding?.status || 'unknown',
      referenceRange: finding?.referenceRange || '',
      date: report?.date || null,
      source: report?.source || 'Lab report',
      reportName: report?.testNames || report?.orderId || 'Lab Report'
    }))
  );

  return {
    totalReports: labReports.length,
    totalFindings: flattenedFindings.length,
    criticalCount: flattenedFindings.filter((finding) => finding.status === 'Critical').length,
    cautionCount: flattenedFindings.filter((finding) => finding.status === 'Caution').length,
    normalCount: flattenedFindings.filter((finding) => finding.status === 'Normal').length,
    highlightedFindings: flattenedFindings
      .sort((left, right) => {
        const severityRank = { Critical: 0, Caution: 1, Normal: 2 };
        const severityDifference = (severityRank[left.status] ?? 3) - (severityRank[right.status] ?? 3);
        if (severityDifference !== 0) {
          return severityDifference;
        }

        return new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime();
      })
      .slice(0, 12)
  };
};

const parseReportFiles = (reportValue) => {
  if (!reportValue) {
    return [];
  }

  if (Array.isArray(reportValue)) {
    return reportValue.filter(Boolean);
  }

  if (typeof reportValue === 'string') {
    try {
      const parsed = JSON.parse(reportValue);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch (error) {
      if (/^https?:\/\//i.test(reportValue)) {
        return [{ path: reportValue, url: reportValue, originalName: 'Lab Report' }];
      }
    }
  }

  return [];
};

const extractPrescriptionTestArtifacts = (testsValue) => {
  const parsedTests = parseFlexibleArray(testsValue, (test) => test).filter(Boolean);
  const artifacts = [];

  parsedTests.forEach((test) => {
    if (typeof test !== 'object' || !test) {
      return;
    }

    const reports = parseReportFiles(test.testReports);
    reports.forEach((report) => {
      const reportUrl = report.url || report.path;
      if (!reportUrl) {
        return;
      }

      artifacts.push({
        url: reportUrl,
        source: 'Prescription Report',
        name: report.originalName || report.filename || `${test.name || 'Prescription'} Report`,
        date: report.uploadedAt || test.approvedAt || test.createdAt || null,
        orderId: test.sampleId || test.id || null,
        testNames: test.name || 'Prescription Lab Report'
      });
    });
  });

  return artifacts;
};

const hasMeaningfulExtractedData = (data) => {
  if (!data || data.error) {
    return false;
  }

  return Boolean(
    (Array.isArray(data.labResults) && data.labResults.length > 0) ||
    (Array.isArray(data.diagnoses) && data.diagnoses.length > 0) ||
    (Array.isArray(data.medications) && data.medications.length > 0) ||
    (typeof data.doctorNotes === 'string' && data.doctorNotes.trim())
  );
};

const buildFallbackClinicalInsight = ({ diagnoses, medications, labResults }) => {
  const flattenedLabs = labResults.flatMap((lab) => lab.findings || []);
  const keyFindings = flattenedLabs.slice(0, 5).map((finding) => ({
    title: finding.test || 'Lab result',
    status: normalizeUiStatus(finding.status),
    reason: `${finding.value || 'N/A'} ${finding.unit || ''}`.trim(),
    source: 'Laboratory data',
    date: null
  }));

  const overallStatus = getOverallInsightStatus(keyFindings);

  return {
    overallStatus,
    summary: overallStatus === 'Normal'
      ? 'Recent records look broadly stable, with no clearly critical abnormalities detected in the cached data.'
      : 'Recent records include findings that need closer review, especially in the latest labs and medication history.',
    improved: [],
    worsened: keyFindings.filter((finding) => finding.status !== 'Normal').map((finding) => finding.title),
    stable: diagnoses.slice(0, 3).map((diagnosis) => diagnosis.condition || diagnosis.diagnosis).filter(Boolean),
    activeMedications: dedupeMedications(medications).slice(0, 10).map((medication) => ({
      name: medication.name,
      dosage: medication.dosage || '',
      instructions: medication.instructions || medication.frequency || '',
      status: medication.status || 'active'
    })),
    keyFindings,
    followUpConsiderations: overallStatus === 'Normal'
      ? ['Continue monitoring routine follow-up records.']
      : ['Review abnormal lab trends and reconcile them with the most recent prescriptions.']
  };
};

const generateFastPatientNarrative = async ({ patient, diagnoses, symptoms, medications, labCount }) => {
  if (!hasGroqApiKey()) {
    return 'AI Summary unavailable (Groq API Key not configured). Displaying structured records only.';
  }

  const prompt = `
You are Livora's patient insight assistant.
Write a concise 2-3 sentence clinical narrative for a dashboard card.
Stay factual, avoid definitive medical advice, and mention only information present in the input.

Patient snapshot: ${JSON.stringify({
  age: patient.user?.dateOfBirth,
  gender: patient.user?.gender,
  chronicConditions: patient.chronicConditions,
  allergies: patient.allergies
})}
Recent diagnoses: ${JSON.stringify(diagnoses.slice(0, 5))}
Recent symptoms: ${JSON.stringify(symptoms.slice(0, 5))}
Active medications: ${JSON.stringify(medications.slice(0, 8))}
Recent completed lab reports: ${labCount}
`;

  return createChatCompletion({
    model: LLAMA_MODELS.patientInsight,
    messages: [
      { role: 'system', content: 'You are a professional medical scribe for patient-facing summaries.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.1,
    maxTokens: 180,
    timeoutMs: 12000,
    fallbackModel: LLAMA_MODELS.patientInsightSmall
  });
};

const generateClinicalReconciliation = async ({
  patient,
  diagnoses,
  symptoms,
  medications,
  labResults,
  documentEvidence
}) => {
  if (!hasGroqApiKey()) {
    return buildFallbackClinicalInsight({ diagnoses, medications, labResults });
  }

  const prompt = `You are Livora's Llama Reasoning Engine for clinical reconciliation.
Your task is to compare multiple extracted medical records and reconcile what has improved, worsened, and which medications are currently active.
Use only the evidence provided. If something is unclear, say it is unclear.
Return JSON only with this exact shape:
{
  "overallStatus": "Normal|Caution|Critical",
  "summary": "string",
  "improved": ["string"],
  "worsened": ["string"],
  "stable": ["string"],
  "activeMedications": [{"name": "string", "dosage": "string", "instructions": "string", "status": "active|completed|held|unknown"}],
  "keyFindings": [{"title": "string", "status": "Normal|Caution|Critical", "reason": "string", "source": "string", "date": "YYYY-MM-DD|null"}],
  "followUpConsiderations": ["string"]
}

Patient profile: ${JSON.stringify({
  chronicConditions: patient.chronicConditions,
  allergies: patient.allergies,
  bloodPressure: patient.bloodPressure,
  pulse: patient.pulse,
  weight: patient.weight,
  height: patient.height
})}
Diagnoses: ${JSON.stringify(diagnoses.slice(0, 12))}
Symptoms: ${JSON.stringify(symptoms.slice(0, 12))}
Medication candidates: ${JSON.stringify(medications.slice(0, 15))}
Lab report findings: ${JSON.stringify(labResults.slice(0, 8))}
Document evidence: ${JSON.stringify(documentEvidence.slice(0, 8))}
`;

  const insight = await requestStructuredJson({
    model: LLAMA_MODELS.documentExtraction,
    systemPrompt: 'You are a careful clinical reconciliation engine. Return JSON only and never invent evidence.',
    userPrompt: prompt,
    temperature: 0.1,
    maxTokens: 2200,
    timeoutMs: 25000,
    fallbackModel: LLAMA_MODELS.documentExtractionSmall
  });

  const normalizedKeyFindings = Array.isArray(insight?.keyFindings)
    ? insight.keyFindings.map((finding) => ({
        title: finding?.title || 'Clinical finding',
        status: ['Normal', 'Caution', 'Critical'].includes(finding?.status) ? finding.status : normalizeUiStatus(finding?.status),
        reason: finding?.reason || '',
        source: finding?.source || 'Clinical reconciliation',
        date: finding?.date || null
      }))
    : [];

  return {
    overallStatus: ['Normal', 'Caution', 'Critical'].includes(insight?.overallStatus)
      ? insight.overallStatus
      : getOverallInsightStatus(normalizedKeyFindings),
    summary: insight?.summary || 'Clinical reconciliation is available, but a concise summary was not returned.',
    improved: Array.isArray(insight?.improved) ? insight.improved : [],
    worsened: Array.isArray(insight?.worsened) ? insight.worsened : [],
    stable: Array.isArray(insight?.stable) ? insight.stable : [],
    activeMedications: dedupeMedications(Array.isArray(insight?.activeMedications) ? insight.activeMedications : medications).slice(0, 10),
    keyFindings: normalizedKeyFindings,
    followUpConsiderations: Array.isArray(insight?.followUpConsiderations) ? insight.followUpConsiderations : []
  };
};

// Get patient profile
const getPatientProfile = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    
    const patient = await Patient.findByPk(patientId, {
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: { patient }
    });
  } catch (error) {
    next(error);
  }
};

// Update patient profile
const updatePatientProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const patientId = req.params.id;
    const { 
      bloodType, allergies, emergencyContact, emergencyPhone, 
      insuranceProvider, insuranceNumber,
      height, weight, bloodPressure, pulse,
      chronicConditions, pastSurgeries, familyMedicalHistory,
      smokingStatus, alcoholConsumption, physicalActivity
    } = req.body;

    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Helper to handle numeric conversions properly
    const toNum = (val) => {
      if (val === '' || val === undefined || val === null) return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    try {
      await patient.update({
        bloodType: bloodType || null,
        allergies: allergies || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        insuranceProvider: insuranceProvider || null,
        insuranceNumber: insuranceNumber || null,
        height: toNum(height),
        weight: toNum(weight),
        bloodPressure: bloodPressure || null,
        pulse: toNum(pulse),
        chronicConditions: chronicConditions || null,
        pastSurgeries: pastSurgeries || null,
        familyMedicalHistory: familyMedicalHistory || null,
        smokingStatus: smokingStatus || null,
        alcoholConsumption: alcoholConsumption || null,
        physicalActivity: physicalActivity || null
      });
    } catch (dbError) {
      console.error('[patientController] Failed to update patient fields:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Database update failed. Ensure schema is up to date.',
        error: dbError.message
      });
    }

    const updatedPatient = await Patient.findByPk(patientId, {
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: { patient: updatedPatient }
    });
  } catch (error) {
    next(error);
  }
};

// Get patient medical records
const getMedicalRecords = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    const { page = 1, limit = 10, recordType } = req.query;

    const whereClause = { patientId };
    if (recordType) {
      whereClause.recordType = recordType;
    }

    const records = await MedicalRecord.findAndCountAll({
      where: whereClause,
      include: [
        {
          association: 'doctor',
          include: [{ association: 'user', attributes: ['firstName', 'lastName', 'dateOfBirth', 'gender'] }]
        },
        {
          association: 'appointment',
          attributes: ['appointmentDate', 'appointmentTime']
        }
      ],
      order: [['recordDate', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      success: true,
      data: {
        records: records.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(records.count / parseInt(limit)),
          totalRecords: records.count,
          hasNext: parseInt(page) * parseInt(limit) < records.count,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get patient appointments
const getPatientAppointments = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    const { page = 1, limit = 10, status, type } = req.query;

    const whereClause = { patientId };
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const appointments = await Appointment.findAndCountAll({
      where: whereClause,
      include: [
        {
          association: 'doctor',
          include: [{ association: 'user', attributes: ['firstName', 'lastName', 'email'] }]
        }
      ],
      order: [['appointmentDate', 'DESC']],
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

// Create medical record
const createMedicalRecord = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const patientId = req.params.id;
    const { doctorId, appointmentId, recordType, title, description, diagnosis, treatment, medications, vitalSigns, labResults, attachments, isPrivate } = req.body;

    const medicalRecord = await MedicalRecord.create({
      patientId,
      doctorId,
      appointmentId,
      recordType,
      title,
      description,
      diagnosis,
      treatment,
      medications,
      vitalSigns,
      labResults,
      attachments,
      isPrivate: isPrivate || false
    });

    const createdRecord = await MedicalRecord.findByPk(medicalRecord.id, {
      include: [
        {
          association: 'doctor',
          include: [{ association: 'user', attributes: ['firstName', 'lastName', 'dateOfBirth', 'gender'] }]
        },
        {
          association: 'appointment',
          attributes: ['appointmentDate', 'appointmentTime']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Medical record created successfully',
      data: { medicalRecord: createdRecord }
    });
  } catch (error) {
    next(error);
  }
};

// Get current patient profile (using authenticated user)
const getCurrentPatientProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    
    const patient = await Patient.findOne({
      where: { userId },
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    res.json({
      success: true,
      data: { patient }
    });
  } catch (error) {
    next(error);
  }
};

// Update current patient profile (using authenticated user)
const updateCurrentPatientProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const userId = req.user.id; // From auth middleware
    const { 
      bloodType, allergies, emergencyContact, emergencyPhone, 
      insuranceProvider, insuranceNumber, medicalHistory, currentMedications,
      height, weight, bloodPressure, pulse,
      chronicConditions, pastSurgeries, familyMedicalHistory,
      smokingStatus, alcoholConsumption, physicalActivity
    } = req.body;

    const patient = await Patient.findOne({
      where: { userId }
    });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Helper to handle numeric conversions properly
    const toNum = (val) => {
      if (val === '' || val === undefined || val === null) return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    try {
      await patient.update({
        bloodType: bloodType || null,
        allergies: allergies || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        insuranceProvider: insuranceProvider || null,
        insuranceNumber: insuranceNumber || null,
        medicalHistory: medicalHistory || null,
        currentMedications: currentMedications || null,
        height: toNum(height),
        weight: toNum(weight),
        bloodPressure: bloodPressure || null,
        pulse: toNum(pulse),
        chronicConditions: chronicConditions || null,
        pastSurgeries: pastSurgeries || null,
        familyMedicalHistory: familyMedicalHistory || null,
        smokingStatus: smokingStatus || null,
        alcoholConsumption: alcoholConsumption || null,
        physicalActivity: physicalActivity || null
      });
    } catch (dbError) {
      console.error('[patientController] Failed to update patient fields:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Database update failed. Ensure schema is up to date.',
        error: dbError.message
      });
    }

    const updatedPatient = await Patient.findByPk(patient.id, {
      include: [
        {
          association: 'user',
          attributes: { exclude: ['password'] }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: { patient: updatedPatient }
    });
  } catch (error) {
    next(error);
  }
};

// Get patient dashboard stats
const getPatientDashboardStats = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      totalAppointments,
      todayAppointments,
      completedAppointments,
      pendingAppointments,
      requestedAppointments,
      scheduledAppointments
    ] = await Promise.all([
      Appointment.count({ where: { patientId } }),
      Appointment.count({ 
        where: { 
          patientId, 
          appointmentDate: { [Op.between]: [startOfDay, endOfDay] }
        }
      }),
      Appointment.count({ where: { patientId, status: 'completed' } }),
      Appointment.count({ where: { patientId, status: { [Op.in]: ['scheduled', 'confirmed'] } } }),
      Appointment.count({ where: { patientId, status: 'requested' } }),
      Appointment.count({ where: { patientId, status: 'scheduled' } })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalAppointments,
          todayAppointments,
          completedAppointments,
          pendingAppointments,
          requestedAppointments,
          scheduledAppointments
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Upload profile image
const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const userId = req.user.id;
    
    // Find the patient profile
    const patient = await Patient.findOne({
      where: { userId }
    });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Upload to Cloudinary
    let imageUrl = '';
    try {
      const result = await uploadToCloudinary(req.file.path, 'patient_profiles');
      imageUrl = result.secure_url;
    } catch (uploadError) {
      console.error('Cloudinary upload failure:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image to cloud storage'
      });
    }
    
    // Update the patient's profile image
    await patient.update({
      profileImage: imageUrl
    });

    // Also update the user's profile image
    const user = await User.findByPk(userId);
    if (user) {
      await user.update({
        profileImage: imageUrl
      });
    }

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        imageUrl: imageUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// Upload medical document
const uploadMedicalDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided'
      });
    }

    const userId = req.user.id;
    const documentName = req.body.documentName || req.file.originalname;
    const documentType = req.body.documentType || 'Lab Report';
    
    // Find the patient profile
    const patient = await Patient.findOne({
      where: { userId }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Upload to Cloudinary
    let fileUrl = '';
    try {
      const result = await uploadToCloudinary(req.file.path, 'patient_documents');
      fileUrl = result.secure_url;
    } catch (uploadError) {
      console.error('Cloudinary document upload failure:', uploadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload document to cloud storage'
      });
    }
    
    // Append to medicalDocuments JSON array
    const currentDocuments = patient.medicalDocuments || [];
    const newDocument = {
      id: Date.now().toString(),
      name: documentName,
      type: documentType,
      url: fileUrl,
      fileName: req.file.originalname,
      uploadDate: new Date().toISOString()
    };
    
    await patient.update({
      medicalDocuments: [...currentDocuments, newDocument]
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        document: newDocument
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get patient medical summary (aggregated from prescriptions, labs, and profile)
const getPatientMedicalSummary = async (req, res, next) => {
  try {
    const patientId = req.params.id;
    const shouldReanalyzeLegacyDocs = ['true', '1', 'yes'].includes(String(req.query.reanalyze || '').toLowerCase());
    
    // 1. Fetch Patient Profile
    const patient = await Patient.findByPk(patientId, {
      include: [{ association: 'user', attributes: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone'] }]
    });

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // 2. Fetch Latest Prescriptions (to extract Diagnoses, Symptoms, and Medications)
    const latestPrescriptions = await Prescription.findAll({
      where: { patientId },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [
        {
          association: 'doctor',
          include: [{ association: 'user', attributes: ['firstName', 'lastName'] }]
        }
      ]
    });

    const prescriptionsWithReports = await Prescription.findAll({
      where: { patientId },
      attributes: ['id', 'appointmentId', 'createdAt', 'testReports', 'tests'],
      order: [['createdAt', 'DESC']]
    });

    // Extract aggregated data from prescriptions
    let summarizedDiagnoses = [];
    let recentSymptoms = [];
    let recentMedications = [];

    latestPrescriptions.forEach(presc => {
      // Parse diagnosis
      if (presc.diagnosis) {
        const diagnoses = parseFlexibleArray(presc.diagnosis, (diagnosis) =>
          typeof diagnosis === 'string'
            ? { condition: diagnosis, date: presc.createdAt, source: 'Prescription' }
            : { ...diagnosis, condition: diagnosis?.condition || diagnosis?.description, date: presc.createdAt, source: 'Prescription' }
        );
        summarizedDiagnoses.push(...diagnoses);
      }

      // Parse symptoms
      if (presc.symptoms) {
        const symptoms = parseFlexibleArray(presc.symptoms, (symptom) =>
          typeof symptom === 'string'
            ? { symptom, date: presc.createdAt, source: 'Prescription' }
            : { ...symptom, symptom: symptom?.symptom || symptom?.description, date: presc.createdAt, source: 'Prescription' }
        );
        recentSymptoms.push(...symptoms);
      }

      // Parse medicines (only from the most recent prescription to represent 'current')
      if (presc.medicines && recentMedications.length === 0) {
        recentMedications = parseFlexibleArray(presc.medicines, (medicine) =>
          typeof medicine === 'string'
            ? { name: medicine, dosage: '', instructions: '', source: 'Prescription', status: 'active' }
            : { ...medicine, source: 'Prescription', status: medicine?.status || 'active' }
        );
      }
    });

    // 3. Collect ALL Medical Documents (from Lab Orders and MedVault)
    let allMedicalDocuments = [];

    // A. Documents from Lab Orders
    const allLabOrders = await LabTestOrder.findAll({
      where: {
        patientId,
        [Op.or]: [
          { status: { [Op.in]: ['completed', 'results_ready'] } },
          { testReports: { [Op.ne]: null } },
          { resultUrl: { [Op.ne]: null } }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    for (const order of allLabOrders) {
      const reports = [
        ...parseReportFiles(order.testReports),
        ...parseReportFiles(order.resultUrl)
      ];
      const testIds = order.testIds || [];
      const tests = await LabTest.findAll({ where: { id: testIds }, attributes: ['name'] });
      const testNames = tests.map(t => t.name).join(', ') || 'Lab Investigation';

      reports.forEach(r => {
        if (r.url || r.path) {
          allMedicalDocuments.push({
            url: r.url || r.path,
            source: 'Lab Order',
            orderId: order.orderNumber,
            date: order.createdAt,
            testNames
          });
        }
      });
    }

    // C. Test reports attached to prescriptions / appointments
    prescriptionsWithReports.forEach((prescription) => {
      const reports = parseReportFiles(prescription.testReports);
      const prescribedTests = parseFlexibleArray(prescription.tests, (test) =>
        typeof test === 'string' ? test : (test?.name || test?.description || '')
      ).filter(Boolean);

      reports.forEach((report) => {
        const reportUrl = report.url || report.path;
        if (reportUrl) {
          allMedicalDocuments.push({
            url: reportUrl,
            source: 'Prescription Report',
            name: report.originalName || report.filename || 'Prescription Test Report',
            date: report.uploadedAt || prescription.createdAt,
            orderId: prescription.appointmentId ? `Appointment #${prescription.appointmentId}` : `Prescription #${prescription.id}`,
            testNames: prescribedTests.join(', ') || 'Prescription Lab Report'
          });
        }
      });

      const nestedArtifacts = extractPrescriptionTestArtifacts(prescription.tests);
      nestedArtifacts.forEach((artifact) => {
        allMedicalDocuments.push({
          ...artifact,
          date: artifact.date || prescription.createdAt,
          orderId: artifact.orderId || (prescription.appointmentId ? `Appointment #${prescription.appointmentId}` : `Prescription #${prescription.id}`)
        });
      });
    });

    // B. Documents from MedVault (Patient Profile)
    if (patient.medicalDocuments && Array.isArray(patient.medicalDocuments)) {
      patient.medicalDocuments.forEach(doc => {
        if (doc.url) {
          allMedicalDocuments.push({
            url: doc.url,
            source: 'MedVault',
            name: doc.name || 'Uploaded Document',
            date: doc.uploadedAt || doc.createdAt || new Date()
          });
        }
      });
    }

    // 4. Analyze All Documents and Aggregate Findings
    let recentLabResults = [];
    let extraDiagnoses = [];
    let documentMedications = [];
    let documentEvidence = [];
    let upgradedDocumentCount = 0;
    let reusableCacheCount = 0;
    let legacyCacheCount = 0;

    // Sort documents by date DESC and analyze all associated documents
    allMedicalDocuments.sort((a, b) => new Date(b.date) - new Date(a.date));
    const docsToAnalyze = allMedicalDocuments;

    for (const doc of docsToAnalyze) {
      try {
        const urlHash = crypto.createHash('sha256').update(doc.url).digest('hex');
        let docCache = await DocumentCache.findOne({ where: { urlHash } });

        const needsUpgrade = docCache && isLegacyGeminiModelVersion(docCache.modelVersion);
        if (needsUpgrade) {
          legacyCacheCount++;
        }

        const shouldAutoRefreshLegacyCache =
          needsUpgrade &&
          !hasMeaningfulExtractedData(docCache?.extractedData);

        if (!docCache || !docCache.extractedData || shouldAutoRefreshLegacyCache || (shouldReanalyzeLegacyDocs && needsUpgrade)) {
          let extractedData = null;
          try {
            extractedData = await extractionService.extractDataFromDocument(doc.url);
            
            if (!extractedData) {
              console.warn(`[Medical Summary] Extraction returned null for ${doc.url}`);
              throw new Error('Extraction service returned null');
            }

            if (extractedData.error) {
              console.warn(`[Medical Summary] Extraction error for ${doc.url}:`, extractedData.error);
              throw new Error(`Extraction error: ${extractedData.error}`);
            }

            // Ensure extractedData is not null before saving
            if (!docCache) {
              console.log(`[DocumentCache] Creating new cache for ${doc.url.substring(0, 80)}...`);
              docCache = await DocumentCache.create({
                url: doc.url,
                urlHash,
                extractedData: extractedData || {},
                modelVersion: extractedData.modelVersion || RECONCILIATION_MODEL_VERSION
              });
              console.log(`[DocumentCache] ✅ Cache created successfully`);
            } else {
              console.log(`[DocumentCache] Updating existing cache for ${doc.url.substring(0, 80)}...`);
              await docCache.update({
                extractedData: extractedData || {},
                modelVersion: extractedData.modelVersion || RECONCILIATION_MODEL_VERSION
              });
              await docCache.reload();
              console.log(`[DocumentCache] ✅ Cache updated successfully`);
            }

            if (needsUpgrade || shouldAutoRefreshLegacyCache) {
              upgradedDocumentCount++;
            }
          } catch (cacheError) {
            console.error(`[DocumentCache] Failed to save cache for ${doc.url}:`, cacheError.message);
            console.error(`[DocumentCache] Error details:`, cacheError.errors || cacheError.stack?.split('\n').slice(0, 3).join('\n'));
            // Use extracted data for summary even if cache save failed
            if (extractedData && !extractedData.error) {
              console.log(`[Medical Summary] Still using extracted data even though cache save failed`);
              docCache = { extractedData: extractedData, modelVersion: extractedData.modelVersion };
            }
            // Continue processing other documents even if one fails
          }
        } else {
          reusableCacheCount++;
        }

        if (docCache && docCache.extractedData) {
          const data = docCache.extractedData;
          const documentModelVersion = docCache.modelVersion || data.modelVersion || null;
          
          // If it's a lab report, add to recentLabResults
          if (data.labResults && data.labResults.length > 0) {
            recentLabResults.push({
              orderId: doc.orderId || doc.name || 'Lab Report',
              date: doc.date,
              testNames: doc.testNames || data.testNames || (data.labResults.map(l => l.test).join(', ')) || 'Lab Extraction',
              findings: data.labResults,
              source: doc.source,
              modelVersion: documentModelVersion
            });
          }

          // If it has diagnoses, add to extraDiagnoses
          if (data.diagnoses && data.diagnoses.length > 0) {
            extraDiagnoses.push(...data.diagnoses.map(d => ({
              condition: d.condition,
              status: d.status,
              date: doc.date,
              source: `Extracted from ${doc.source}`
            })));
          }

          if (data.medications && data.medications.length > 0) {
            documentMedications.push(...data.medications.map((medication) => ({
              ...medication,
              source: `Extracted from ${doc.source}`,
              status: medication?.status || 'active'
            })));
          }

          documentEvidence.push({
            documentType: data.documentType || 'other',
            source: doc.source,
            date: doc.date,
            modelVersion: documentModelVersion,
            diagnoses: (data.diagnoses || []).slice(0, 4),
            labResults: (data.labResults || []).slice(0, 6),
            medications: (data.medications || []).slice(0, 6)
          });
        }
      } catch (err) {
        console.error("[Medical Summary] Document Analysis Failed:", doc.url);
        console.error("[Medical Summary] Error details:", err.message);
        if (err.stack) {
          console.error("[Medical Summary] Stack trace:", err.stack.split('\n').slice(0, 3).join('\n'));
        }
      }
    }

    // Merge extra diagnoses into the list
    summarizedDiagnoses.push(...extraDiagnoses);
    const reconciledMedications = dedupeMedications([...recentMedications, ...documentMedications]);

    // 5. Generate fast dashboard narrative with Llama-3.1-8b-instant
    let aiClinicalNarrative = 'Aggregating clinical data for AI analysis...';
    try {
      aiClinicalNarrative = await generateFastPatientNarrative({
        patient,
        diagnoses: summarizedDiagnoses,
        symptoms: recentSymptoms,
        medications: reconciledMedications,
        labCount: allLabOrders.length
      });
    } catch (aiError) {
      console.error('[patientController] Groq Summary Error:', aiError.response?.data || aiError.message);
      aiClinicalNarrative = 'Clinical analysis currently unavailable. Please review the structured records below.';
    }

    let llamaClinicalInsight;
    try {
      llamaClinicalInsight = await generateClinicalReconciliation({
        patient,
        diagnoses: summarizedDiagnoses,
        symptoms: recentSymptoms,
        medications: reconciledMedications,
        labResults: recentLabResults,
        documentEvidence
      });
    } catch (insightError) {
      console.error('[patientController] Llama Reconciliation Error:', insightError.response?.data || insightError.message);
      llamaClinicalInsight = buildFallbackClinicalInsight({
        diagnoses: summarizedDiagnoses,
        medications: reconciledMedications,
        labResults: recentLabResults
      });
    }

    const allLabResultsSummary = buildLabResultsSummary(recentLabResults);

    // 6. Construct Comprehensive Summary
    const medicalSummary = {
      aiClinicalNarrative,
      aiClinicalNarrativeModel: SUMMARY_MODEL_VERSION,
      llamaClinicalInsight,
      llamaReasoningModel: RECONCILIATION_MODEL_VERSION,
      cacheMeta: {
        modelVersion: RECONCILIATION_MODEL_VERSION,
        analyzedDocuments: docsToAnalyze.length,
        reusableCacheCount,
        legacyCacheCount,
        upgradedDocumentCount,
        reanalysisPerformed: shouldReanalyzeLegacyDocs
      },
      patientInfo: {
        bloodType: patient.bloodType,
        height: patient.height,
        weight: patient.weight,
        bloodPressure: patient.bloodPressure,
        pulse: patient.pulse,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
        pastSurgeries: patient.pastSurgeries,
        familyMedicalHistory: patient.familyMedicalHistory,
        smokingStatus: patient.smokingStatus,
        alcoholConsumption: patient.alcoholConsumption,
        physicalActivity: patient.physicalActivity,
        profileCurrentMedications: patient.currentMedications
      },
      summarizedDiagnoses: summarizedDiagnoses.slice(0, 10), // Keep top 10 recent
      recentSymptoms: recentSymptoms.slice(0, 10),
      recentMedications: reconciledMedications,
      recentLabResults: recentLabResults,
      allLabResultsSummary
    };

    res.json({
      success: true,
      data: { summary: medicalSummary }
    });

  } catch (error) {
    console.error('[patientController] getPatientMedicalSummary error:', error);
    next(error);
  }
};

module.exports = {
  getPatientProfile,
  updatePatientProfile,
  getCurrentPatientProfile,
  updateCurrentPatientProfile,
  uploadProfileImage,
  uploadMedicalDocument,
  getMedicalRecords,
  getPatientAppointments,
  getPatientDashboardStats,
  createMedicalRecord,
  getPatientMedicalSummary
};
