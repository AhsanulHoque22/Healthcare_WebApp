const { callWithFallbackStandard } = require('../llm/llmDispatcher');

const CLASSIFIER_MODEL = 'llama-3.1-8b-instant';
const CLASSIFIER_TIMEOUT_MS = 4000;

// Regex patterns for deterministic pre-screening before LLM call
const EMERGENCY_PATTERNS = [
  /\b(chest pain|heart attack|can't breathe|not breathing|unconscious|seizure|stroke|overdose|suicide|kill myself|self.harm|bleeding heavily|severe bleeding|anaphylaxis|allergic reaction)\b/i,
];

const DRUG_PATTERNS = [
  /\b(drug interaction|can i take|safe to take|combine.*medication|medication.*combine|interact.*with|contraindicated|overdose.*dose)\b/i,
];

const DOSAGE_PATTERNS = [
  /\b(how much|what dose|dosage|mg|milligram|how many.*pill|pill.*how many|twice a day|once a day|maximum dose)\b/i,
];

const DIAGNOSIS_PATTERNS = [
  /\b(do i have|is it|could it be|am i sick|what disease|what condition|diagnose|diagnosis)\b/i,
];

const APPOINTMENT_PATTERNS = [
  /\b(book|schedule|cancel|reschedule|appointment|available.*doctor|find.*doctor|see.*doctor)\b/i,
];

const PERSONAL_DATA_PATTERNS = [
  /\b(medicin|medication|prescription|drug|vitals|blood|lab|test|record|history|profile|summary|status)\b/i,
];

const SYSTEM_PROMPT = `You are a medical query classifier. Classify the user message into exactly one intent and one risk level.

INTENT options:
- GENERAL: greetings, small talk, unclear queries, non-medical topics
- APPOINTMENT: booking, cancelling, rescheduling appointments, finding doctors
- PERSONAL_DATA: requests about own health records, vitals, lab results, prescriptions, profile
- MEDICAL_QA: general medical knowledge questions not about personal data
- DRUG_INTERACTION: questions about combining medications or drug safety
- DOSAGE: questions about medication dosage, frequency, or amounts
- DIAGNOSIS: asking what disease or condition they might have
- EMERGENCY: severe symptoms, life-threatening situations, self-harm

RISK_LEVEL options:
- LOW: greetings, appointment management, general health info
- MEDIUM: medical knowledge queries, personal health records
- HIGH: drug interactions, dosage questions, diagnosis requests
- CRITICAL: emergency symptoms, self-harm, life-threatening situations

Respond with ONLY valid JSON, no explanation:
{"intent": "<INTENT>", "riskLevel": "<RISK_LEVEL>"}`;

/**
 * Classifies user intent and risk level before the main reasoning loop.
 * Uses fast regex pre-screening to avoid LLM calls for obvious cases.
 *
 * @param {string} message
 * @returns {Promise<{intent: string, riskLevel: string, source: 'regex'|'llm'}>}
 */
async function classifyIntent(message) {
  // Fast path: deterministic regex check before spending a network call
  const regexResult = _regexClassify(message);
  if (regexResult) {
    return { ...regexResult, source: 'regex' };
  }

  // Slow path: LLM classification for ambiguous messages
  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message.slice(0, 500) }, // Cap input to 500 chars
    ];

    const result = await callWithFallbackStandard(messages, []);
    const raw = result.content || '';
    const parsed = _parseClassifierResponse(raw);
    return { ...parsed, source: 'llm' };
  } catch (err) {
    // Never block the main chat on classifier failure — default to safe values
    console.warn('[IntentClassifier] Failed, defaulting to GENERAL/LOW:', err.message);
    return { intent: 'GENERAL', riskLevel: 'LOW', source: 'fallback' };
  }
}

function _regexClassify(message) {
  if (EMERGENCY_PATTERNS.some((p) => p.test(message))) {
    return { intent: 'EMERGENCY', riskLevel: 'CRITICAL' };
  }
  if (DRUG_PATTERNS.some((p) => p.test(message))) {
    return { intent: 'DRUG_INTERACTION', riskLevel: 'HIGH' };
  }
  if (DOSAGE_PATTERNS.some((p) => p.test(message))) {
    return { intent: 'DOSAGE', riskLevel: 'HIGH' };
  }
  if (DIAGNOSIS_PATTERNS.some((p) => p.test(message))) {
    return { intent: 'DIAGNOSIS', riskLevel: 'HIGH' };
  }
  if (APPOINTMENT_PATTERNS.some((p) => p.test(message))) {
    return { intent: 'APPOINTMENT', riskLevel: 'LOW' };
  }
  if (PERSONAL_DATA_PATTERNS.some((p) => p.test(message))) {
    return { intent: 'PERSONAL_DATA', riskLevel: 'LOW' };
  }
  return null;
}

function _parseClassifierResponse(raw) {
  const VALID_INTENTS = new Set([
    'GENERAL', 'APPOINTMENT', 'PERSONAL_DATA', 'MEDICAL_QA',
    'DRUG_INTERACTION', 'DOSAGE', 'DIAGNOSIS', 'EMERGENCY',
  ]);
  const VALID_RISK_LEVELS = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

  try {
    const cleaned = raw.replace(/```json|```/gi, '').trim();
    const parsed = JSON.parse(cleaned);

    const intent = VALID_INTENTS.has(parsed.intent) ? parsed.intent : 'GENERAL';
    const riskLevel = VALID_RISK_LEVELS.has(parsed.riskLevel) ? parsed.riskLevel : 'LOW';
    return { intent, riskLevel };
  } catch {
    return { intent: 'GENERAL', riskLevel: 'LOW' };
  }
}

module.exports = { classifyIntent };
