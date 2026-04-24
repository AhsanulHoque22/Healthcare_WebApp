/**
 * patientMemory.js
 *
 * Provides cross-session patient context so returning patients don't need
 * to re-explain their conditions, allergies, and medications each time.
 */

const axios = require('axios');
const { Patient, User } = require('../../models');

const MEMORY_MODEL = 'llama-3.1-8b-instant';
const MAX_INSIGHTS_LENGTH = 400;

/**
 * Builds a formatted context string from the patient's stored profile and
 * any AI-extracted insights from previous conversations.
 *
 * @param {number} userId
 * @returns {Promise<string|null>} Formatted context string, or null if nothing useful.
 */
async function getPatientContext(userId) {
  try {
    const patient = await Patient.findOne({
      where: { userId },
      include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }],
    });

    if (!patient) return null;

    const lines = [];

    const name = [patient.user?.firstName, patient.user?.lastName].filter(Boolean).join(' ');
    const demographics = [
      name ? `Name: ${name}` : null,
      patient.bloodType ? `Blood Type: ${patient.bloodType}` : null,
      patient.height ? `Height: ${patient.height} cm` : null,
      patient.weight ? `Weight: ${patient.weight} kg` : null,
    ].filter(Boolean).join(', ');

    if (demographics) lines.push(demographics);
    if (patient.allergies) lines.push(`Allergies: ${patient.allergies}`);
    if (patient.chronicConditions) lines.push(`Chronic Conditions: ${patient.chronicConditions}`);
    if (patient.currentMedications) lines.push(`Current Medications: ${patient.currentMedications}`);
    if (patient.medicalHistory) lines.push(`Medical History: ${patient.medicalHistory.slice(0, 200)}`);
    if (patient.pastSurgeries) lines.push(`Past Surgeries: ${patient.pastSurgeries}`);
    if (patient.smokingStatus && patient.smokingStatus !== 'never') lines.push(`Smoking: ${patient.smokingStatus}`);

    const insights = patient.aiContext?.insights;
    if (insights) lines.push(`Prior AI Notes: ${insights}`);

    if (lines.length === 0) return null;

    return `PATIENT LONG-TERM CONTEXT (use this to avoid asking the patient to repeat themselves):\n${lines.map(l => `- ${l}`).join('\n')}`;
  } catch (err) {
    console.warn('[PatientMemory] getPatientContext error:', err.message);
    return null;
  }
}

/**
 * After a conversation completes, extracts key medical facts and stores them
 * on the Patient record so they're available in future sessions.
 * Fire-and-forget: callers should not await this.
 *
 * @param {number} userId
 * @param {Array<{role: string, content: string}>} messages - The full message thread
 */
async function updatePatientContext(userId, messages) {
  if (!process.env.GROQ_API_KEY) return;

  try {
    const patient = await Patient.findOne({ where: { userId } });
    if (!patient) return;

    // Only extract from user + assistant turns (skip system messages and tool outputs)
    const conversationText = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .filter(m => typeof m.content === 'string' && m.content.trim())
      .map(m => `${m.role === 'user' ? 'Patient' : 'AI'}: ${m.content.slice(0, 300)}`)
      .join('\n');

    if (!conversationText) return;

    const extractionPrompt = `Extract only new, durable medical facts about this patient from the conversation below that a doctor should remember for future visits. Focus on: newly mentioned conditions, allergies, medications, symptoms, concerns, or lifestyle factors. If nothing new is mentioned, respond with "none". Keep under 400 characters, comma-separated facts only.

CONVERSATION:
${conversationText.slice(0, 1500)}`;

    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: MEMORY_MODEL,
        messages: [{ role: 'user', content: extractionPrompt }],
        temperature: 0.0,
        max_tokens: 120,
      },
      {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        timeout: 8000,
      }
    );

    const extracted = res.data?.choices?.[0]?.message?.content?.trim() || '';
    if (!extracted || extracted.toLowerCase() === 'none') return;

    const existing = patient.aiContext?.insights || '';
    const merged = existing
      ? `${existing}, ${extracted}`.slice(0, MAX_INSIGHTS_LENGTH)
      : extracted.slice(0, MAX_INSIGHTS_LENGTH);

    await patient.update({ aiContext: { insights: merged } });
    console.log(`[PatientMemory] Updated insights for userId=${userId}`);
  } catch (err) {
    console.warn('[PatientMemory] updatePatientContext error:', err.message);
  }
}

module.exports = { getPatientContext, updatePatientContext };
