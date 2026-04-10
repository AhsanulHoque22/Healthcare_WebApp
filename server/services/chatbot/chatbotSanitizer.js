/**
 * chatbotSanitizer.js
 * 
 * Ensures the LLM never receives sensitive or unnecessary internal fields.
 * Every tool defines a whitelist of safe fields matching actual Sequelize model keys.
 */

const TOOL_WHITELISTS = {
  get_patient_profile: [
    'name', 'age', 'gender', 'bloodType', 'height', 'weight', 
    'allergies', 'chronicConditions', 'currentMedications', 'physicalActivity'
  ],
  get_appointments: [
    'id', 'appointmentDate', 'appointmentTime', 'status', 'serialNumber',
    'type', 'reason', 'doctorName', 'department', 'hospital'
  ],
  search_doctors: [
    'id', 'doctorName', 'department', 'hospital', 'consultationFee', 
    'rating', 'experience', 'availability'
  ],
  get_prescriptions: [
    'id', 'createdAt', 'doctorName', 'diagnosis', 'medicines', 'suggestions', 'tests'
  ],
  get_active_medicines: [
    'medicineName', 'dosage', 'frequency', 'instructions', 'startDate', 'active'
  ],
  get_lab_orders: [
    'orderNumber', 'status', 'totalAmount', 'sampleCollectionDate', 
    'expectedResultDate', 'resultAvailable'
  ],
  get_medical_records: [
    'recordType', 'title', 'recordDate', 'doctorName', 'diagnosis', 'treatment', 'description'
  ],
  book_appointment: [
    'success', 'appointmentId', 'date', 'doctorName', 'note'
  ],
  trigger_emergency: [
    'triggered', 'symptoms'
  ]
};

/**
 * Whitelists object fields.
 */
function sanitizeOutput(toolName, data) {
  const whitelist = TOOL_WHITELISTS[toolName];
  if (!whitelist) {
    console.warn(`[SANITIZER] No whitelist found for tool: ${toolName}`);
    return {};
  }

  if (Array.isArray(data)) {
    return data.map(item => filterObject(item, whitelist));
  }
  return filterObject(data, whitelist);
}

function filterObject(obj, whitelist) {
  if (!obj || typeof obj !== 'object') return obj;
  const filtered = {};
  whitelist.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      filtered[key] = obj[key];
    }
  });
  return filtered;
}

/**
 * Detects sensitive data leaks in final LLM text responses.
 */
function detectSensitiveLeak(text) {
  if (!text) return text;
  
  // Detect raw JSON strings that look like DB dumps
  const jsonPattern = /\{"(\w+)":(\d+|".*"),"(\w+)":\d+\}/g;
  // Detect database internal names
  const systemPattern = /Sequelize|mysql\.|users\.|patientProfile|doctorProfile/i;

  if (jsonPattern.test(text) || systemPattern.test(text)) {
    console.warn("[SECURITY] Possible data leak detected in AI response. Redacting.");
    return "I apologize, but I encountered an internal error while processing that response. Please try rephrasing your request.";
  }

  return text;
}

module.exports = { sanitizeOutput, detectSensitiveLeak };
