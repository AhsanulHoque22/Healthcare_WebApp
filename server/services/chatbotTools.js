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

// ─── TOOL DEFINITIONS (JSON Schema for LLM) ───────────────────────────────────

const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "get_patient_profile",
      description: "Retrieve basic health profile (allergies, blood type, vitals).",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_appointments",
      description: "Fetch upcoming or past appointments.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["requested", "scheduled", "confirmed", "completed", "all"] },
          limit: { type: "integer", minimum: 1, maximum: 10 }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_doctors",
      description: "Search verified doctors by department/name.",
      parameters: {
        type: "object",
        properties: {
          department: { type: "string" },
          keyword: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_prescriptions",
      description: "Get patient's medication history and past diagnoses.",
      parameters: { type: "object", properties: { limit: { type: "integer", maximum: 5 } } }
    }
  },
  {
    type: "function",
    function: {
      name: "get_active_medicines",
      description: "List currently active medications.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_lab_orders",
      description: "Track status of lab test orders.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_medical_records",
      description: "Fetch visit history, past treatments, and diagnostic history.",
      parameters: {
        type: "object",
        properties: {
          recordType: {
            type: "string",
            enum: ["consultation", "lab_result", "imaging", "prescription", "vaccination", "surgery", "all"],
            description: "Type of medical record to filter by. Default is 'all'."
          },
          limit: { type: "integer", maximum: 5 }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Book an appointment. Requires doctorId from search_doctors.",
      parameters: {
        type: "object",
        properties: {
          doctorId: { type: "integer" },
          appointmentDate: { type: "string", description: "YYYY-MM-DD" },
          timeBlock: { type: "string", description: "e.g. '09:00 AM - 12:00 PM'" },
          symptoms: { type: "string" }
        },
        required: ["doctorId", "appointmentDate", "timeBlock"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "trigger_emergency",
      description: "Trigger emergency alert for high-risk symptoms.",
      parameters: {
        type: "object",
        properties: {
          symptoms: { type: "string" },
          confidence: { type: "string", enum: ["high", "very_high"] }
        },
        required: ["symptoms", "confidence"]
      }
    }
  }
];

// ─── TOOL IMPLEMENTATIONS ─────────────────────────────────────────────────────

const implementations = {
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
      physicalActivity: p.physicalActivity
    };
  },

  get_appointments: async (params, userId) => {
    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) return [];
    const where = { patientId: patient.id };
    if (params.status && params.status !== 'all') where.status = params.status;
    
    const raw = await Appointment.findAll({
      where,
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
    if (params.department) {
      where.department = { [Op.like]: `%${params.department.toLowerCase().replace(/\s+/g, '_')}%` };
    }
    if (params.keyword) {
      where[Op.or] = [
        { hospital: { [Op.like]: `%${params.keyword}%` } },
        { department: { [Op.like]: `%${params.keyword}%` } }
      ];
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
    const raw = await Prescription.findAll({
      where: { patientId: patient.id },
      include: [{ association: 'doctor', include: [{ association: 'user', attributes: ['firstName', 'lastName'] }] }],
      limit: params.limit || 3,
      order: [['createdAt', 'DESC']]
    });

    return raw.map(p => ({
      id: p.id,
      createdAt: p.createdAt,
      doctorName: p.doctor ? `Dr. ${p.doctor.user.firstName} ${p.doctor.user.lastName}` : 'Unknown',
      diagnosis: p.diagnosis,
      medicines: p.medicines,
      suggestions: p.suggestions,
      tests: p.tests
    }));
  },

  get_active_medicines: async (_, userId) => {
    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) return [];
    return await Medicine.findAll({ 
      where: { patientId: patient.id, isActive: true },
      attributes: ['medicineName', 'dosage', 'frequency', 'instructions', 'startDate', 'isActive']
    });
  },

  get_lab_orders: async (_, userId) => {
    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) return [];
    return await LabTestOrder.findAll({ 
      where: { patientId: patient.id }, 
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
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
    
    // Parse timeBlock to approximate appointmentTime (e.g. "09:00 AM - 12:00 PM" -> "09:00:00")
    let appointmentTime = '09:00:00';
    try {
      const firstPart = params.timeBlock.split('-')[0].trim();
      const [timePart, meridiem] = firstPart.split(' ');
      if (timePart && meridiem) {
        let [hours, minutes] = timePart.split(':');
        let h = parseInt(hours);
        if (meridiem === 'PM' && h < 12) h += 12;
        if (meridiem === 'AM' && h === 12) h = 0;
        appointmentTime = `${h.toString().padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}:00`;
      }
    } catch (e) { /* fallback */ }
    
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

  trigger_emergency: async (params, userId) => {
    await Notification.create({
      userId,
      title: '🚨 AI EMERGENCY ALERT',
      message: `Critical symptoms detected: ${params.symptoms}`,
      type: 'error'
    });
    return { triggered: true, symptoms: params.symptoms };
  }
};

// ─── DISPATCHER ─────────────────────────────────────────────────────────────

async function executeTool(toolName, args, context) {
  const toolFn = implementations[toolName];
  if (!toolFn) return { error: true, message: `Tool '${toolName}' not found.` };
  return await secureExecute(toolFn, toolName, args, context);
}

module.exports = { TOOL_DEFINITIONS, executeTool };
