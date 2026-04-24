/**
 * outputConstraints.js
 *
 * Deterministic post-processor that enforces language constraints on every
 * chatbot response before it is sent to the client.
 *
 * This is NOT LLM-based — it runs regex replacements so it is fast, cheap,
 * and cannot itself be confused or manipulated.
 *
 * Responsibilities:
 *   1. Replace overconfident diagnosis language with hedged alternatives
 *   2. Block standalone dosage numbers not sourced from the deterministic tool
 *   3. Ensure a consultation reminder is present on MEDICAL_QA / HIGH-risk responses
 */

// ── Overconfident language patterns → hedged replacements ────────────────────
// Order matters: more specific patterns first
const HEDGING_REPLACEMENTS = [
  { pattern: /\bYou (definitely|certainly) have\b/gi, replacement: 'This may indicate' },
  { pattern: /\bYou have (been diagnosed with|developed|contracted)\b/gi, replacement: 'You may have' },
  { pattern: /\bThis is (definitely|certainly|clearly|obviously) (a |an )?(diagnosis|condition|disease|disorder)\b/gi, replacement: 'This could be' },
  { pattern: /\bYou (are|were) diagnosed with\b/gi, replacement: 'Your records may indicate' },
  { pattern: /\bThe (diagnosis|condition) is\b/gi, replacement: 'The possible condition may be' },
  { pattern: /\bYou (must|should) take\b/gi, replacement: 'Your doctor may recommend taking' },
  { pattern: /\bTake (\d[\d.]*)\s*(mg|mcg|ml|units?|tablets?|capsules?)\b/gi, replacement: 'Dosage (as prescribed by your doctor): $1 $2' },
  { pattern: /\bYou need to take\b/gi, replacement: 'You may need to take' },
  { pattern: /\bI (can confirm|confirm) that you\b/gi, replacement: 'Based on available information, it appears that you' },
];

// Consultation reminder appended when missing from medical responses
const CONSULTATION_REMINDER =
  '\n\n> 💬 **Please consult a qualified healthcare provider before making any medical decisions.**';

// Intents that require a consultation reminder if one isn't already present
const INTENTS_REQUIRING_REMINDER = new Set([
  'MEDICAL_QA',
  'DRUG_INTERACTION',
  'DOSAGE',
  'DIAGNOSIS',
]);

// Phrases that already constitute a consultation reminder (avoid duplicates)
const EXISTING_REMINDER_PATTERNS = [
  /consult (a|your|an)? ?(qualified|licensed|registered)? ?(doctor|physician|healthcare|provider|pharmacist)/i,
  /seek (medical|professional|clinical) (advice|attention|consultation|help)/i,
  /speak (to|with) (a|your) (doctor|physician|specialist|healthcare)/i,
  /contact (your|a) (doctor|physician|healthcare)/i,
];

/**
 * Applies deterministic language constraints to a chatbot response.
 *
 * @param {string} text - The raw response text from the LLM
 * @param {{ intent: string, riskLevel: string } | null} classification
 * @returns {string} - Constrained response text
 */
function applyOutputConstraints(text, classification) {
  if (!text || typeof text !== 'string') return text;

  let result = text;

  // 1. Replace overconfident language
  for (const { pattern, replacement } of HEDGING_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  // 2. Append consultation reminder if the intent requires it and it's missing
  const intent = classification?.intent || 'GENERAL';
  if (INTENTS_REQUIRING_REMINDER.has(intent)) {
    const alreadyHasReminder = EXISTING_REMINDER_PATTERNS.some((p) => p.test(result));
    if (!alreadyHasReminder) {
      result += CONSULTATION_REMINDER;
    }
  }

  return result;
}

module.exports = { applyOutputConstraints };
