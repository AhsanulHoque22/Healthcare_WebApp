/**
 * criticalQuestionGate.js
 *
 * Reads the intent classifier output and decides how the request should be
 * handled before it enters the main LLM reasoning loop.
 *
 * Actions:
 *   PROCEED            — normal path, no extra constraints
 *   SAFETY_PIPELINE    — route through high-accuracy pipeline + validator
 *   EMERGENCY_SHORTCIRCUIT — skip LLM, trigger emergency immediately
 */

const DISCLAIMERS = {
  DRUG_INTERACTION:
    '\n\n> ⚠️ **Important:** Drug interaction information is provided for general awareness only. Always consult your prescribing physician or pharmacist before changing your medication regimen.',
  DOSAGE:
    '\n\n> ⚠️ **Important:** Dosage guidance shown here is for reference only. Never adjust your medication dose without consulting a qualified healthcare provider.',
  DIAGNOSIS:
    '\n\n> ⚠️ **Disclaimer:** I can provide general health information but cannot diagnose medical conditions. Please consult a licensed physician for a proper evaluation.',
  MEDICAL_QA:
    '\n\n> ℹ️ This information is for educational purposes only and does not constitute medical advice. Consult a healthcare professional for personal medical guidance.',
  EMERGENCY:
    '\n\n> 🆘 **This appears to be a medical emergency.** If you or someone nearby is in immediate danger, call **999** (or your local emergency number) right now.',
};

/**
 * @param {{ intent: string, riskLevel: string }} classification
 * @returns {{ action: string, disclaimer: string|null, safetyPipelineTriggered: boolean }}
 */
function evaluate(classification) {
  const { intent, riskLevel } = classification;

  if (riskLevel === 'CRITICAL' || intent === 'EMERGENCY') {
    return {
      action: 'EMERGENCY_SHORTCIRCUIT',
      disclaimer: DISCLAIMERS.EMERGENCY,
      safetyPipelineTriggered: true,
    };
  }

  if (riskLevel === 'HIGH' || intent === 'DRUG_INTERACTION' || intent === 'DOSAGE' || intent === 'DIAGNOSIS') {
    return {
      action: 'SAFETY_PIPELINE',
      disclaimer: DISCLAIMERS[intent] || DISCLAIMERS.MEDICAL_QA,
      safetyPipelineTriggered: true,
    };
  }

  if (intent === 'MEDICAL_QA' || riskLevel === 'MEDIUM') {
    return {
      action: 'PROCEED',
      disclaimer: DISCLAIMERS.MEDICAL_QA,
      safetyPipelineTriggered: false,
    };
  }

  return {
    action: 'PROCEED',
    disclaimer: null,
    safetyPipelineTriggered: false,
  };
}

module.exports = { evaluate };
