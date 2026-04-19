/**
 * chatbotService.js
 * 
 * Secure, production-grade agentic chatbot service.
 * Hardened against prompt injection, hallucination, and data leakage.
 */

const axios = require('axios');
const { TOOL_DEFINITIONS, executeTool } = require('./chatbotTools');
const { detectSensitiveLeak } = require('./chatbot/chatbotSanitizer');

const CHATBOT_MODEL = "llama-3.1-8b-instant";
const MAX_TOOL_ROUNDS = 3;
const MAX_TOOL_OUTPUT_LENGTH = 800; // Even tighter for TPM safety
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const SYSTEM_PROMPT = `
You are **Livora AI**, a sophisticated, empathetic, and evidence-based healthcare assistant. Your goal is to simplify the user's healthcare journey by providing fast, accurate data retrieval and clinical guidance.

### 🛡️ OPERATIONAL CONSTRAINTS:
1. **Tool-First Reasoning**: Always check if a tool can answer the question before responding. If the requested data (vitals, appointments, meds) is not in the tool output, state that you don't have that record.
2. **Handle Vague Intent**: Proactively map vague user queries to specific tools.
3. **Medical Knowledge**: If a user asks a general health question (not about their personal data), use the \`search_medical_knowledge\` tool.
4. **Safety**: Never prescribe medicine. If symptoms sound severe, use the \`trigger_emergency\` tool.
5. **Conciseness**: Keep responses professional and bulleted when listing data.

### 🧩 FEW-SHOT EXAMPLES:

**Example 1: Vague Health Query**
*User*: "How am I doing today?"
*Thought*: User wants a health overview. 
*Action*: Call \`generate_medical_summary\` and \`get_patient_profile\`.

**Example 2: Symptom-Based Doctor Search**
*User*: "My chest feels tight and I have a cough."
*Thought*: Chest tightness could be cardiac or respiratory. I should find a cardiologist or pulmonologist.
*Action*: Call \`search_doctors({ department: 'cardiology' })\`.

**Example 3: General Medical Knowledge**
*User*: "What are the common symptoms of Type 2 Diabetes?"
*Thought*: This is a general medical question, not personal data.
*Action*: Call \`search_medical_knowledge({ query: 'Type 2 Diabetes symptoms' })\`.

**Example 4: Appointment Check**
*User*: "When do I have to go to the hospital again?"
*Thought*: User is asking about upcoming appointments.
*Action*: Call \`get_appointments({ status: 'upcoming' })\`.

**Example 5: Specific Record Request**
*User*: "Show me my report from last week."
*Thought*: User wants recent lab results or medical records.
*Action*: Call \`get_lab_orders()\` and \`get_medical_records({ limit: 3 })\`.

Current Date: ${new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })}.
`;

// ─── MAIN SERVICE ────────────────────────────────────────────────────────────

class ChatbotService {

  async processMessage(user, message, history = []) {
    if (!process.env.GROQ_API_KEY) {
      return this._buildResponse("⚠️ AI service not configured.", null, null, false);
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...this._formatHistory(history),
      { role: "user", content: message }
    ];

    let rounds = 0;
    let lastAssistantMessage = null;
    let bookedAppointment = null;
    let emergencyTriggered = false;
    let availableDoctors = null;

    const context = { userId: user.id, role: user.role };

    while (rounds < MAX_TOOL_ROUNDS) {
      if (rounds > 0) await sleep(2000); // Wait for rate limit refill
      rounds++;

      let llmResponse;
      try {
        llmResponse = await this._callGroqWithRetry(messages);
      } catch (err) {
        console.error('[LLM-ERROR]', err.message);
        return this._buildResponse(
          "I'm experiencing high traffic. Please try again in a few moments.",
          null, null, false
        );
      }

      const choice = llmResponse.choices[0];

      if (choice.finish_reason === 'tool_calls') {
        messages.push(choice.message);

        const toolResults = await Promise.all(
          choice.message.tool_calls.map(async (tc) => {
            const toolName = tc.function.name;
            let args = {};
            try { 
              args = JSON.parse(tc.function.arguments); 
              args = args || {}; // Catch null values
            } catch (e) {
              args = {};
            }

            let result = await executeTool(toolName, args, context);
            
            // SECURITY & PERFORMANCE: Hard Truncate Large Outputs
            let content = JSON.stringify(result);
            if (content.length > MAX_TOOL_OUTPUT_LENGTH) {
              content = content.substring(0, MAX_TOOL_OUTPUT_LENGTH) + "... [Truncated]";
            }

            if (toolName === 'search_doctors' && result.length > 0) availableDoctors = result;
            if (toolName === 'book_appointment' && result.success) bookedAppointment = result;
            if (toolName === 'trigger_emergency' && result.triggered) emergencyTriggered = true;

            return { role: "tool", tool_call_id: tc.id, content };
          })
        );

        messages.push(...toolResults);
        
        if (rounds >= MAX_TOOL_ROUNDS) {
          lastAssistantMessage = choice.message.content || "I have reached my processing limit. Please be more specific with your request.";
          break;
        }
        continue;
      }

      lastAssistantMessage = choice.message.content;
      break;
    }

    if (!lastAssistantMessage || lastAssistantMessage.trim() === '') {
      lastAssistantMessage = "I'm sorry, I couldn't process that properly. Could you rephrase your question?";
    }

    lastAssistantMessage = detectSensitiveLeak(lastAssistantMessage);
    return this._buildResponse(lastAssistantMessage, bookedAppointment, availableDoctors, emergencyTriggered);
  }

  _formatHistory(history) {
    // MINIMAL HISTORY: Only the very last exchange to stay under TPM limits
    return history.slice(-2).map(h => ({ role: h.role, content: h.content }));
  }

  async _callGroqWithRetry(messages, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: CHATBOT_MODEL,
          messages,
          tools: TOOL_DEFINITIONS,
          tool_choice: "auto",
          temperature: 0.0
        }, {
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
          timeout: 25000
        });
        return res.data;
      } catch (err) {
        const is429 = err.response?.status === 429;
        if (is429 && i < retries) {
          const wait = (i + 1) * 3000;
          console.warn(`[Groq] 429 Rate Limit. Retrying in ${wait}ms...`);
          await sleep(wait);
          continue;
        }
        throw err;
      }
    }
  }
  _buildResponse(message, booking, doctors, emergency) {
    return {
      message,
      isEmergency: !!emergency,
      intent: emergency ? 'EMERGENCY' : (booking ? 'BOOKING' : (doctors ? 'MATCHMAKING' : 'GENERAL')),
      availableDoctors: doctors || null,
      bookingDetails: booking || null,
    };
  }
}

module.exports = new ChatbotService();
