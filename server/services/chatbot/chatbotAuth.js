/**
 * chatbotAuth.js
 * 
 * Centralized Role-Based (RBAC) and Attribute-Based (ABAC) Access Control.
 */

const { Appointment, Patient, Doctor } = require('../../models');

const RBAC_POLICIES = {
  patient: {
    allowedTools: [
      'generate_medical_summary',
      'analyze_medical_document',
      'get_patient_profile', 
      'get_appointments', 
      'get_prescriptions', 
      'get_active_medicines', 
      'get_lab_orders', 
      'get_medical_records', 
      'book_appointment', 
      'cancel_appointment',
      'reschedule_appointment',
      'trigger_emergency',
      'search_doctors'
    ]
  },
  doctor: {
    allowedTools: [
      'search_doctors', 
      'get_appointments'
    ]
  },
  admin: {
    allowedTools: [
      'search_doctors'
    ]
  }
};

/**
 * Enforces access based on role and specific data attributes.
 */
async function enforceAccess({ userId, role, toolName, params }) {
  // 1. Role-Based Tool Check
  const policy = RBAC_POLICIES[role];
  if (!policy || !policy.allowedTools.includes(toolName)) {
    throw new Error(`Access Denied: Role '${role}' is not authorized to use tool '${toolName}'.`);
  }

  // 2. Attribute-Based Checks (Ownership & Assignment)
  if (role === 'patient') {
    // Patients can only access their own data.
    // The userId is injected into individual tools for this purpose.
    return true;
  }

  if (role === 'doctor') {
    // Doctors might have restrictions on which patients they can see.
    // (Future implementation: Verify appointment match before returning specific patient data)
    return true;
  }

  return true;
}

module.exports = { enforceAccess };
