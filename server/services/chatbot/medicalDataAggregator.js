const { Patient } = require('../../models');
const clinicalService = require('../clinicalService');

function calculateAge(dob) {
  if (!dob) return 'Unk';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

/**
 * Aggregates high-fidelity medical data for the AI Chatbot context.
 * Utilizes the centralized clinicalService to ensure parity with the Patient Dashboard.
 * 
 * @param {number} userId - The unique ID of the user (Patient).
 * @returns {Promise<Object>} - High-fidelity medical summary.
 */
async function aggregateMedicalData(userId) {
  try {
    // 1. Find the patient profile first
    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) {
      return { error: true, message: "No patient profile found. Please complete your profile setup." };
    }

    // 2. Fetch the Unified Medical Summary (same as UI)
    const summary = await clinicalService.getUnifiedMedicalSummary(patient.id);

    // 3. Format and return specifically for LLM context
    return {
      success: true,
      patient: {
        demographics: `Name: ${summary.patientInfo.name}, Age: ${calculateAge(summary.patientInfo.dateOfBirth)}, Gender: ${summary.patientInfo.gender}, Blood: ${summary.patientInfo.bloodType || 'Unk'}`,
        clinicalSnapshot: `Allergies: ${summary.patientInfo.allergies || 'None'}, Chronic Conditions: ${summary.patientInfo.chronicConditions || 'None'}`
      },
      aiInsights: {
        summary: summary.aiClinicalNarrative,
        clinicalReconciliation: summary.llamaClinicalInsight.summary,
        overallStatus: summary.llamaClinicalInsight.overallStatus
      },
      clinicalRecords: {
        diagnoses: summary.summarizedDiagnoses.slice(0, 10).map(d => `${d.condition} (Source: ${d.source}, Date: ${d.date})`),
        medications: summary.recentMedications.map(m => `${m.name} ${m.dosage || ''} - ${m.instructions || 'As directed'} (${m.status})`),
        labResults: summary.recentLabResults.slice(0, 10).map(l => ({
          test: l.testNames,
          date: l.date,
          findings: l.findings.map(f => `${f.test}: ${f.value} ${f.unit || ''} (${f.status})`).join('; ')
        })),
        symptoms: summary.recentSymptoms.slice(0, 5).map(s => `${s.symptom} (Date: ${s.date})`)
      },
      labStats: summary.allLabResultsSummary,
      followUp: summary.llamaClinicalInsight.followUpConsiderations
    };
  } catch (error) {
    console.error("[medicalDataAggregator] Failed to aggregate data:", error.message);
    return { error: true, message: `System error during record retrieval: ${error.message}` };
  }
}

module.exports = { aggregateMedicalData };
