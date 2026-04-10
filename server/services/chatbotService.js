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
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const SYSTEM_PROMPT = `
You are Livora AI. Concise instructions:
1. ONLY use data from tool calls. NO fabrication.
2. Greeting: "Hi, I'm Livora. How can I help?" (No tools).
3. Booking: search_doctors -> ask choice -> date -> time -> symptoms -> CONFIRM -> book.
4. Summary: Use generate_medical_summary. Mention demographics, activity, labs, meds, risks.
5. Analysis: For specific files, use analyze_medical_document(url).
6. Consistency: Flag contradictions between DB and files.
Today: ${new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })}.
`;


// ─── MAIN SERVICE ────────────────────────────────────────────────────────────

class ChatbotService {

  async processMessage(user, message, history = []) {
    if (!process.env.GROQ_API_KEY) {
      console.error('[ChatbotService] GROQ_API_KEY is not set. Add it to .env and Railway environment variables.');
      return this._buildResponse(
        "⚠️ The AI service is not configured. Please contact support.",
        null, null, false
      );
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
      if (rounds > 0) await sleep(1200); // 1.2s delay to allow TPM recovery
      rounds++;

      let llmResponse;
      try {
        llmResponse = await this._callGroq(messages);
      } catch (err) {
        const status = err.response?.status;
        const errBody = err.response?.data;
        console.error('[LLM-ERROR]', { status, message: err.message, body: errBody });

        // Return specific, actionable error messages
        if (status === 401) {
          return this._buildResponse(
            "The AI service API key is invalid or expired. Please update GROQ_API_KEY in Railway environment variables.",
            null, null, false
          );
        }
        if (status === 429) {
          return this._buildResponse(
            "The AI service is temporarily rate-limited. Please wait a moment and try again.",
            null, null, false
          );
        }
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          return this._buildResponse(
            "The AI took too long to respond. Please try a shorter message or try again.",
            null, null, false
          );
        }
        return this._buildResponse(
          "I'm having trouble reaching the AI service. Please try again in a moment.",
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
            try { args = JSON.parse(tc.function.arguments); } catch (e) {}

            const result = await executeTool(toolName, args, context);

            if (toolName === 'search_doctors' && result.length > 0) availableDoctors = result;
            if (toolName === 'book_appointment' && result.success) bookedAppointment = result;
            if (toolName === 'trigger_emergency' && result.triggered) emergencyTriggered = true;

            return { role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) };
          })
        );

        messages.push(...toolResults);
        continue;
      }

      lastAssistantMessage = choice.message.content;
      break;
    }

    lastAssistantMessage = detectSensitiveLeak(lastAssistantMessage);

    return this._buildResponse(lastAssistantMessage, bookedAppointment, availableDoctors, emergencyTriggered);
  }

  _formatHistory(history) {
    return history.slice(-5).map(h => {
      let content = h.content;
      // Reduce token bloat by only passing essential doctor info in context
      if (h.availableDoctors && Array.isArray(h.availableDoctors)) {
        const docSummaries = h.availableDoctors.map(d => ({
          id: d.id,
          name: d.doctorName || d.name,
          specialty: d.department
        }));
        content += `\n[Context: Previous doctors displayed: ${JSON.stringify(docSummaries)}]`;
      }
      return { role: h.role, content };
    });
  }

  async _callGroq(messages) {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: CHATBOT_MODEL,
      messages,
      tools: TOOL_DEFINITIONS,
      tool_choice: "auto",
      temperature: 0.0 // Zero temperature for deterministic tool calling
    }, {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      timeout: 25000
    });
    return res.data;
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
