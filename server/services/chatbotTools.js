/**
 * chatbotTools.js
 * 
 * Secure, medical-grade tool implementations.
 * Optimized for LLM reasoning and flattened for strict sanitization.
 */

const { Op } = require('sequelize');
const {
  User, Patient, Doctor, Appointment,
  MedicalRecord, Prescription, Medicine,
  LabTestOrder, Notification
} = require('../models');

const { secureExecute } = require('./chatbot/secureToolWrapper');
const { analyzeDocument } = require('./extractionService');
const { aggregateMedicalData } = require('./chatbot/medicalDataAggregator');
const { checkDrugInteraction, getDosageInfo } = require('./chatbot/deterministicMedicalTools');

// ─── TOOL DEFINITIONS (JSON Schema for LLM) ───────────────────────────────────

// ─── TOOL DEFINITIONS (JSON Schema for LLM) ───────────────────────────────────

const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "generate_medical_summary",
      description: "Harness this tool when the user asks vague, high-level, or holistic health questions like 'How am I doing?', 'Summarize my health', or 'What's my status?'. It aggregates profile data, vitals, active medications, upcoming appointments, recent lab results, and medical vault documents into a comprehensive 'Patient 360' overview.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_patient_profile",
      description: "Use this to retrieve the user's core demographic and clinical profile. This includes blood type, height, weight, allergies, chronic conditions, and general medical history. Ideal for answering 'What's my blood type?' or 'What allergies do I have on record?'.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_appointments",
      description: "Retrieve a list of the user's medical appointments. Use this for queries like 'When is my next doctor visit?', 'What's my appointment history?', or 'Do I have any meetings tomorrow?'. It can filter by status (scheduled, confirmed, completed, upcoming) and supports a limit for concise lists.",
      parameters: {
        type: "object",
        properties: {
          status: { 
            type: "string", 
            enum: ["scheduled", "confirmed", "completed", "all", "upcoming"],
            description: "Filter by appointment status. Use 'upcoming' for meetings in the future."
          },
          limit: { 
            type: "integer", 
            maximum: 10,
            description: "Number of records to return. Default is 5."
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_doctors",
      description: "Crucial tool for 'Doctor Matchmaking'. Use this when a user expresses a need for a doctor, mentions a symptom (e.g., 'my chest hurts', 'I have a rash'), searches for a specific hospital (e.g., 'Applo', 'Square'), or asks for a specialist (e.g., 'Cardiologist', 'Dentist'). It maps symptoms to medical departments automatically.",
      parameters: {
        type: "object",
        properties: {
          department: { 
            type: "string", 
            description: "The medical department (e.g., cardiology, dermatology). Auto-mapped from symptoms if not explicitly mentioned." 
          },
          keyword: { 
            type: "string", 
            description: "Keywords like hospital name, doctor's name, or localized area." 
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_prescriptions",
      description: "Fetch the user's prescription history. Use this when the user asks 'What did Dr. Smith prescribe last month?', 'Show my recent prescriptions', or 'What was my diagnosis in my last visit?'. It identifies the doctor, date, diagnosis, and suggested medications.",
      parameters: { 
        type: "object", 
        properties: { 
          limit: { type: "integer", maximum: 5 },
          doctorName: { type: "string", description: "Optional filter for a specific doctor's name." }
        } 
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_active_medicines",
      description: "Access the list of medications the user is CURRENTLY taking. Essential for questions like 'What medicines should I take right now?', 'Show my current dosage', or 'What is my frequency for Paracetamol?'. Returns drug names, dosages, and precise instructions.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_lab_orders",
      description: "Retrieve laboratory test status and results. Use this when the user asks 'Is my blood test ready?', 'Show my lab reports', or 'What was the result of my CBC?'. Includes order numbers and links to actual PDF results if available.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_medical_records",
      description: "Get broad medical history records, including consultations, imaging, and physical exams. Use for 'Show my medical history' or 'What imaging tests have I done recently?'.",
      parameters: {
        type: "object",
        properties: {
          recordType: { type: "string", enum: ["consultation", "lab_result", "imaging", "prescription", "all"] },
          limit: { type: "integer", maximum: 5 }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_medical_document",
      description: "Perform Deep Inspection on a specific PDF or Image report. Use this ONLY when the user asks a question about a specific document in their vault or a lab report they just viewed. Requires a documentUrl.",
      parameters: {
        type: "object",
        properties: {
          documentUrl: { type: "string", description: "The URL of the PDF/Image to analyze." },
          query: { type: "string", description: "The specific question to ask the OCR engine (e.g. 'What is my hemoglobin level?')." }
        },
        required: ["documentUrl"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Executes the final booking of an appointment. Use ONLY after a doctor has been identified (doctorId), and a date and time slot have been agreed upon. Usually follows a 'search_doctors' call.",
      parameters: {
        type: "object",
        properties: {
          doctorId: { type: "integer", description: "The ID of the doctor to book with." },
          appointmentDate: { type: "string", description: "Date in YYYY-MM-DD format." },
          timeBlock: { type: "string", description: "The selected time slot (e.g. '09:00 AM - 12:00 PM')." },
          symptoms: { type: "string", description: "Brief description of why the user is booking." }
        },
        required: ["doctorId", "appointmentDate", "timeBlock"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancel_appointment",
      description: "Cancel a scheduled appointment. Use when the user says 'Cancel my visit' or 'Delete my appointment tomorrow'. Only works for appointments at least 24 hours in the future.",
      parameters: {
        type: "object",
        properties: {
          appointmentId: { type: "integer", description: "The unique ID of the appointment to cancel." }
        },
        required: ["appointmentId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "reschedule_appointment",
      description: "Moves an existing appointment to a new date/time. Use when the user asks to 'move', 'change', or 'postpone' an appointment. Requires the original appointmentId and new slot details.",
      parameters: {
        type: "object",
        properties: {
          appointmentId: { type: "integer" },
          newDate: { type: "string", description: "New date in YYYY-MM-DD format." },
          timeBlock: { type: "string", description: "New time slot." }
        },
        required: ["appointmentId", "newDate", "timeBlock"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "trigger_emergency",
      description: "CRITICAL: Trigger this tool immediately if the user reports life-threatening symptoms such as heavy chest pain, sudden paralysis, severe bleeding, or unconsciousness. It alerts the hospital and provides the patient with immediate life-saving next steps.",
      parameters: {
        type: "object",
        properties: {
          symptoms: { type: "string", description: "The severe symptoms detected." },
          confidence: { type: "string", enum: ["high", "very_high"] }
        },
        required: ["symptoms", "confidence"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_drug_interaction",
      description: "Look up known interactions between two medications using official FDA drug label data. Use this when a user asks 'Can I take X with Y?', 'Is it safe to combine X and Y?', or 'Do X and Y interact?'. Always use this tool for drug interaction questions — never guess.",
      parameters: {
        type: "object",
        properties: {
          drugA: { type: "string", description: "Name of the first drug (generic or brand name)." },
          drugB: { type: "string", description: "Name of the second drug (generic or brand name)." }
        },
        required: ["drugA", "drugB"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_dosage_info",
      description: "Retrieve official FDA dosage and administration information for a medication. Use this when a user asks 'What is the correct dose of X?', 'How often should I take X?', or 'What is the maximum dose of X?'. Always use this tool for dosage questions — never generate dosage numbers yourself.",
      parameters: {
        type: "object",
        properties: {
          drugName: { type: "string", description: "Name of the drug (generic or brand name)." },
          condition: { type: "string", description: "Optional: the condition being treated, for context." }
        },
        required: ["drugName"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_medical_knowledge",
      description: "The 'Livora Medical Wiki'. Use this tool when the user asks general medical questions that are NOT about their own data, such as 'What are the symptoms of Flu?', 'Side effects of Paracetamol?', or 'How to manage high blood pressure?'. It searches a vast medical knowledge base for evidence-based information.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The medical question or topic to search for." }
        },
        required: ["query"]
      }
    }
  }
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function canModifyAppointment(appointmentDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const apptDate = new Date(appointmentDate);
  apptDate.setHours(0, 0, 0, 0);
  
  // Appt date must be at least 1 day in the future from today
  return apptDate.getTime() > today.getTime();
}

function parseTimeBlock(timeBlock) {
  let appointmentTime = '09:00:00';
  try {
    const firstPart = timeBlock.split('-')[0].trim();
    const [timePart, meridiem] = firstPart.split(' ');
    if (timePart && meridiem) {
      let [hours, minutes] = timePart.split(':');
      let h = parseInt(hours);
      if (meridiem === 'PM' && h < 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      appointmentTime = `${h.toString().padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}:00`;
    }
  } catch (e) { /* fallback */ }
  return appointmentTime;
}

// ─── TOOL IMPLEMENTATIONS ─────────────────────────────────────────────────────

const implementations = {
  generate_medical_summary: async (_, userId) => {
    return await aggregateMedicalData(userId);
  },

  search_medical_knowledge: async (params) => {
    const { createChatCompletion } = require('./groqLlamaService');
    const { retrieve } = require('./chatbot/medicalRetriever');

    const { source, chunks } = await retrieve(params.query);

    // If retrieval found nothing, tell the LLM explicitly so it says
    // "not in knowledge base" rather than guessing
    if (chunks.length === 0) {
      return {
        source: 'Livora Medical Knowledge Base',
        answer: 'This topic is not currently covered in our verified medical knowledge base. Please consult a qualified healthcare provider for accurate information.',
        retrieved: false,
      };
    }

    const context = chunks.join('\n\n---\n\n');

    const systemPrompt = `You are the Livora Medical Knowledge Base assistant.
Answer the user's question using ONLY the verified medical context provided below.
Do NOT add information beyond what is in the context.
If the context does not contain a direct answer, say "The available guidelines do not cover this specific question — please consult a healthcare provider."
Be concise, factual, and professional.

VERIFIED CONTEXT:
${context}`;

    try {
      const answer = await createChatCompletion({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: params.query },
        ],
        temperature: 0.0,
        maxTokens: 600,
        fallbackModel: 'llama-3.1-8b-instant',
      });

      return {
        source,
        answer,
        retrieved: true,
      };
    } catch (e) {
      console.error('[search_medical_knowledge] LLM synthesis failed:', e.message);
      // Return raw context as fallback if synthesis fails
      return {
        source,
        answer: chunks[0],
        retrieved: true,
      };
    }
  },

  get_patient_profile: async (_, userId) => {
    const p = await Patient.findOne({
      where: { userId },
      include: [{ association: 'user', attributes: ['firstName', 'lastName', 'gender', 'dateOfBirth'] }]
    });
    if (!p) return null;
    return {
      name: `${p.user.firstName} ${p.user.lastName}`,
      age: p.user.dateOfBirth ? Math.floor((Date.now() - new Date(p.user.dateOfBirth)) / 31557600000) : 'N/A',
      gender: p.user.gender,
      bloodType: p.bloodType,
      height: p.height,
      weight: p.weight,
      allergies: p.allergies,
      chronicConditions: p.chronicConditions,
      currentMedications: p.currentMedications,
      physicalActivity: p.physicalActivity,
      medicalDocuments: p.medicalDocuments || "None"
    };
  },

  get_appointments: async (params, userId) => {
    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) return [];
    let whereClause = { patientId: patient.id };
    
    if (params.status && params.status !== 'all') {
      if (params.status === 'upcoming') {
        whereClause.status = { [Op.in]: ['requested', 'scheduled', 'confirmed'] };
      } else {
        whereClause.status = params.status;
      }
    }
    
    const raw = await Appointment.findAll({
      where: whereClause,
      include: [{ association: 'doctor', include: [{ association: 'user', attributes: ['firstName', 'lastName'] }] }],
      limit: params.limit || 5,
      order: [['appointmentDate', 'DESC']]
    });

    return raw.map(a => ({
      id: a.id,
      appointmentDate: a.appointmentDate,
      appointmentTime: a.appointmentTime,
      status: a.status,
      serialNumber: a.serialNumber,
      type: a.type,
      reason: a.reason,
      doctorName: a.doctor ? `Dr. ${a.doctor.user.firstName} ${a.doctor.user.lastName}` : 'N/A',
      department: a.doctor?.department,
      hospital: a.doctor?.hospital
    }));
  },

  search_doctors: async (params) => {
    const where = { isVerified: true };

    if (params.department && typeof params.department === 'string') {
      where.department = { [Op.like]: `%${params.department.toLowerCase()}%` };
    }

    if (params.keyword && typeof params.keyword === 'string') {
      const kw = params.keyword.toLowerCase();
      // Strip common English specialist suffixes so "neurologist" matches "neurology",
      // "cardiologist" matches "cardiology", "dentist" matches "dentistry", etc.
      const kwRoot = kw.length > 7 ? kw.slice(0, -3) : kw;
      const orConditions = [
        { hospital: { [Op.like]: `%${kw}%` } },
        { department: { [Op.like]: `%${kw}%` } },
      ];
      if (kwRoot !== kw) {
        orConditions.push({ department: { [Op.like]: `%${kwRoot}%` } });
      }
      where[Op.or] = orConditions;
    }
    
    const raw = await Doctor.findAll({
      where,
      include: [{ association: 'user', attributes: ['firstName', 'lastName'] }],
      limit: 5,
      order: [['rating', 'DESC']]
    });

    return raw.map(d => ({
      id: d.id,
      doctorName: `Dr. ${d.user.firstName} ${d.user.lastName}`,
      department: d.department,
      hospital: d.hospital,
      consultationFee: d.consultationFee,
      rating: d.rating,
      experience: d.experience,
      availability: d.availability
    }));
  },

  get_prescriptions: async (params, userId) => {
    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) return [];
    
    const where = { patientId: patient.id };
    const include = [{ 
      association: 'doctor', 
      include: [{ association: 'user', attributes: ['firstName', 'lastName'] }] 
    }];

    if (params.doctorName) {
      include[0].include[0].where = {
        [Op.or]: [
          { firstName: { [Op.like]: `%${params.doctorName}%` } },
          { lastName: { [Op.like]: `%${params.doctorName}%` } }
        ]
      };
    }

    const raw = await Prescription.findAll({
      where,
      include,
      limit: params.limit || 5,
      order: [['createdAt', 'DESC']]
    });

    return raw.map(p => ({
      id: p.id,
      createdAt: p.createdAt,
      doctorName: p.doctor ? `Dr. ${p.doctor.user.firstName} ${p.doctor.user.lastName}` : 'Unknown',
      department: p.doctor?.department,
      status: p.status,
      diagnosis: p.diagnosis,
      medicines: p.medicines,
      suggestions: p.suggestions,
      tests: p.tests
    }));
  },

  get_active_medicines: async (_, userId) => {
    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) return [];
    const meds = await Medicine.findAll({ 
      where: { patientId: patient.id, isActive: true },
      attributes: ['medicineName', 'dosage', 'frequency', 'instructions', 'startDate', 'isActive']
    });
    return meds.map(m => ({
      ...m.toJSON(),
      warning: "Ensure you follow the dosage instructions strictly. Contact your doctor if side effects occur."
    }));
  },

  get_lab_orders: async (_, userId) => {
    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) return [];
    const raw = await LabTestOrder.findAll({ 
      where: { patientId: patient.id }, 
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    
    return raw.map(l => ({
      orderNumber: l.orderNumber,
      status: l.status,
      createdAt: l.createdAt,
      testIds: l.testIds,
      testReports: l.testReports,
      resultUrl: l.resultUrl,
      notes: l.notes
    }));
  },

  get_medical_records: async (params, userId) => {
    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) return [];
    
    const where = { patientId: patient.id };
    if (params.recordType && params.recordType !== 'all') {
      where.recordType = params.recordType;
    }

    const raw = await MedicalRecord.findAll({ 
      where,
      include: [{ association: 'doctor', include: [{ association: 'user', attributes: ['firstName', 'lastName'] }] }],
      limit: params.limit || 5,
      order: [['recordDate', 'DESC']]
    });

    return raw.map(r => ({
      recordType: r.recordType,
      title: r.title,
      recordDate: r.recordDate,
      doctorName: r.doctor ? `Dr. ${r.doctor.user.firstName} ${r.doctor.user.lastName}` : 'N/A',
      diagnosis: r.diagnosis,
      treatment: r.treatment,
      description: r.description
    }));
  },

  book_appointment: async (params, userId) => {
    const patient = await Patient.findOne({ where: { userId } });
    const doctor = await Doctor.findByPk(params.doctorId, {
      include: [{ association: 'user', attributes: ['firstName', 'lastName'] }]
    });
    if (!patient || !doctor) throw new Error("Entity mismatch during booking.");
    
    if (!params.timeBlock) throw new Error("timeBlock is required for booking.");
    const appointmentTime = parseTimeBlock(params.timeBlock);
    
    const appointment = await Appointment.create({
      patientId: patient.id,
      doctorId: params.doctorId,
      appointmentDate: params.appointmentDate,
      appointmentTime: appointmentTime,
      status: 'requested',
      symptoms: params.symptoms
    });

    return { 
      success: true, 
      appointmentId: appointment.id, 
      date: params.appointmentDate,
      doctorName: `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`,
      note: "Requested successfully. Awaiting confirmation."
    };
  },

  cancel_appointment: async (params, userId) => {
    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) throw new Error("Patient not found.");
    
    const appointment = await Appointment.findOne({ 
      where: { id: params.appointmentId, patientId: patient.id } 
    });
    
    if (!appointment) return { error: true, message: "Appointment not found or not yours." };
    
    if (!canModifyAppointment(appointment.appointmentDate)) {
      return { 
        error: true, 
        message: "Cancellations are only allowed until the day before the appointment. Please contact the hospital directly." 
      };
    }

    await appointment.update({ status: 'cancelled' });
    
    return { success: true, message: `Appointment ${params.appointmentId} cancelled successfully.` };
  },

  reschedule_appointment: async (params, userId) => {
    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) throw new Error("Patient not found.");
    
    const appointment = await Appointment.findOne({ 
      where: { id: params.appointmentId, patientId: patient.id } 
    });
    
    if (!appointment) return { error: true, message: "Appointment not found or not yours." };
    
    if (!canModifyAppointment(appointment.appointmentDate)) {
      return { 
        error: true, 
        message: "Rescheduling is only allowed until the day before the original appointment date." 
      };
    }

    if (!params.timeBlock) throw new Error("timeBlock is required for rescheduling.");
    const appointmentTime = parseTimeBlock(params.timeBlock);

    // Update to requested status for re-approval
    await appointment.update({ 
      appointmentDate: params.newDate,
      appointmentTime: appointmentTime,
      status: 'requested' 
    });

    return { 
      success: true, 
      message: `Reschedule requested for ${params.newDate}. Awaiting new approval.`,
      newDate: params.newDate
    };
  },

  check_drug_interaction: async (params) => {
    return await checkDrugInteraction(params);
  },

  get_dosage_info: async (params) => {
    return await getDosageInfo(params);
  },

  trigger_emergency: async (params, userId) => {
    await Notification.create({
      userId,
      title: '🚨 AI EMERGENCY ALERT',
      message: `Critical symptoms detected: ${params.symptoms}`,
      type: 'error'
    });
    return { triggered: true, symptoms: params.symptoms };
  },

  analyze_medical_document: async (params, userId) => {
    // We let the user pass any documentUrl, usually returned from other tools.
    if (!params.documentUrl) return { error: true, message: "documentUrl is required." };
    const findings = await analyzeDocument(params.documentUrl, params.query);
    return { 
      documentUrl: params.documentUrl, 
      findings 
    };
  }
};

// ─── DISPATCHER ─────────────────────────────────────────────────────────────

async function executeTool(toolName, args, context) {
  const toolFn = implementations[toolName];
  if (!toolFn) return { error: true, message: `Tool '${toolName}' not found.` };
  return await secureExecute(toolFn, toolName, args, context);
}

module.exports = { TOOL_DEFINITIONS, executeTool };
