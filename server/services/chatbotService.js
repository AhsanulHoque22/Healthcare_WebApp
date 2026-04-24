/**
 * chatbotService.js
 * 
 * Secure, production-grade agentic chatbot service.
 * Hardened against prompt injection, hallucination, and data leakage.
 */

const axios = require('axios');
const { TOOL_DEFINITIONS, executeTool } = require('./chatbotTools');
const { detectSensitiveLeak } = require('./chatbot/chatbotSanitizer');
const { classifyIntent } = require('./chatbot/intentClassifier');
const { evaluate: evaluateGate } = require('./chatbot/criticalQuestionGate');
const { validateResponse } = require('./chatbot/responseValidator');
const { applyOutputConstraints } = require('./chatbot/outputConstraints');
const { getLatestSummary } = require('./chatbot/conversationSummarizer');
const obs = require('./chatbot/observability');

// 70B for clinical reasoning accuracy; 8B fallback only when rate-limited
const CHATBOT_MODEL = process.env.GROQ_CHATBOT_MODEL || 'llama-3.3-70b-versatile';
const CHATBOT_FALLBACK_MODEL = 'llama-3.1-8b-instant';
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
5. **Drug & Dosage Questions**: ALWAYS use \`check_drug_interaction\` for drug combination questions and \`get_dosage_info\` for dosage questions. NEVER generate drug interaction or dosage information yourself — these must come from the tool.
6. **Conciseness**: Keep responses professional and bulleted when listing data.

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

  async processMessage(user, message, history = [], conversationId = null) {
    if (!process.env.GROQ_API_KEY) {
      return this._buildResponse("⚠️ AI service not configured.", null, null, false);
    }

    const trace = obs.startTrace({
      userId: user.id,
      sessionId: conversationId,
      userMessage: message,
      metadata: { streaming: false },
    });

    // Classify intent and risk before the reasoning loop — runs in parallel
    // with message setup so it doesn't add latency to the critical path
    const classifyStart = Date.now();
    const [classification] = await Promise.all([
      classifyIntent(message),
    ]);
    obs.logClassification(trace, {
      input: message,
      output: classification,
      durationMs: Date.now() - classifyStart,
    });

    console.log(`[IntentClassifier] intent=${classification.intent} risk=${classification.riskLevel} source=${classification.source}`);

    // Gate decision — determines action and whether a disclaimer must be appended
    const gateDecision = evaluateGate(classification);
    obs.logGateDecision(trace, { classification, decision: gateDecision });
    console.log(`[CriticalQuestionGate] action=${gateDecision.action} safetyPipeline=${gateDecision.safetyPipelineTriggered}`);

    // Emergency short-circuit: skip the LLM loop entirely and trigger the
    // emergency tool directly so there's zero chance of the model ignoring it
    if (gateDecision.action === 'EMERGENCY_SHORTCIRCUIT') {
      const context = { userId: user.id, role: user.role, classification };
      const toolStart = Date.now();
      let toolResult = null;
      try {
        toolResult = await executeTool('trigger_emergency', { reason: message }, context);
      } catch (err) {
        console.error('[Gate] Emergency tool failed:', err.message);
      }
      obs.logToolCall(trace, { toolName: 'trigger_emergency', args: { reason: message }, result: toolResult, durationMs: Date.now() - toolStart });
      const emergencyMessage =
        "🆘 I've detected a potential emergency based on your message and have alerted your care team. " +
        gateDecision.disclaimer;
      const response = this._buildResponse(emergencyMessage, null, null, true, classification, gateDecision);
      obs.finalizeTrace(trace, { output: emergencyMessage, metadata: { isEmergency: true } });
      obs.flush();
      return response;
    }

    // Inject rolling conversation summary so critical context (allergies,
    // prior symptoms, booked appointments) survives beyond the 2-exchange window
    const conversationSummary = await getLatestSummary(user.id, conversationId);

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(conversationSummary
        ? [{ role: "system", content: `CONVERSATION CONTEXT (summary of earlier exchanges):\n${conversationSummary}` }]
        : []),
      ...this._formatHistory(history),
      { role: "user", content: message }
    ];

    let rounds = 0;
    let lastAssistantMessage = null;
    let bookedAppointment = null;
    let emergencyTriggered = false;
    let availableDoctors = null;

    const context = { userId: user.id, role: user.role, classification };

    while (rounds < MAX_TOOL_ROUNDS) {
      if (rounds > 0) await sleep(2000); // Wait for rate limit refill
      rounds++;

      let llmResponse;
      const genStart = new Date();
      try {
        llmResponse = await this._callGroqWithRetry(messages);
      } catch (err) {
        console.error('[LLM-ERROR]', err.message);
        obs.finalizeTrace(trace, { output: null, metadata: { error: err.message } });
        obs.flush();
        return this._buildResponse(
          "I'm experiencing high traffic. Please try again in a few moments.",
          null, null, false
        );
      }
      const genEnd = new Date();

      const choice = llmResponse.choices[0];
      obs.logGeneration(trace, {
        name: `groq-round-${rounds}`,
        model: llmResponse.model || CHATBOT_MODEL,
        messages: messages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content.slice(0, 300) : '[structured]' })),
        output: choice.message.content || '[tool_calls]',
        usageTokens: llmResponse.usage,
        startTime: genStart,
        endTime: genEnd,
      });

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

            const toolStart = Date.now();
            let result = await executeTool(toolName, args, context);
            obs.logToolCall(trace, { toolName, args, result, durationMs: Date.now() - toolStart });

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

    // Deterministic language constraints — runs before LLM validator
    lastAssistantMessage = applyOutputConstraints(lastAssistantMessage, classification);

    // Second-opinion validation — only for SAFETY_PIPELINE (HIGH/CRITICAL) responses
    let validationResult = null;
    if (gateDecision.safetyPipelineTriggered) {
      const preValidation = lastAssistantMessage;
      validationResult = await validateResponse(message, lastAssistantMessage);
      lastAssistantMessage = validationResult.finalResponse;
      obs.logValidation(trace, {
        input: preValidation,
        output: validationResult.finalResponse,
        safe: validationResult.safe,
        issues: validationResult.issues,
      });
    }

    // Append disclaimer for any safety-pipeline or medium-risk response
    if (gateDecision.disclaimer) {
      lastAssistantMessage += gateDecision.disclaimer;
    }

    const finalResponse = this._buildResponse(lastAssistantMessage, bookedAppointment, availableDoctors, emergencyTriggered, classification, gateDecision, validationResult);
    obs.finalizeTrace(trace, {
      output: lastAssistantMessage,
      metadata: { intent: finalResponse.intent, safetyPipelineTriggered: finalResponse.safetyPipelineTriggered, rounds },
    });
    obs.flush();
    return finalResponse;
  }

  // ─── STREAMING ENTRY POINT ──────────────────────────────────────────────────

  async processMessageStream(user, message, history = [], conversationId = null, callbacks = {}) {
    const { onToken = () => {}, onToolStart = () => {}, onComplete = () => {} } = callbacks;

    if (!process.env.GROQ_API_KEY) {
      onComplete({ message: '⚠️ AI service not configured.', isEmergency: false, intent: 'GENERAL', classification: null, safetyPipelineTriggered: false, validated: false, availableDoctors: null, bookingDetails: null });
      return;
    }

    const trace = obs.startTrace({
      userId: user.id,
      sessionId: conversationId,
      userMessage: message,
      metadata: { streaming: true },
    });

    const classifyStart = Date.now();
    const classification = await classifyIntent(message);
    obs.logClassification(trace, { input: message, output: classification, durationMs: Date.now() - classifyStart });

    const gateDecision = evaluateGate(classification);
    obs.logGateDecision(trace, { classification, decision: gateDecision });

    if (gateDecision.action === 'EMERGENCY_SHORTCIRCUIT') {
      const context = { userId: user.id, role: user.role, classification };
      const toolStart = Date.now();
      let toolResult = null;
      try { toolResult = await executeTool('trigger_emergency', { reason: message }, context); } catch {}
      obs.logToolCall(trace, { toolName: 'trigger_emergency', args: { reason: message }, result: toolResult, durationMs: Date.now() - toolStart });
      const emergencyMessage = "🆘 I've detected a potential emergency and have alerted your care team." + gateDecision.disclaimer;
      const response = this._buildResponse(emergencyMessage, null, null, true, classification, gateDecision);
      obs.finalizeTrace(trace, { output: emergencyMessage, metadata: { isEmergency: true } });
      obs.flush();
      onComplete(response);
      return;
    }

    const conversationSummary = await getLatestSummary(user.id, conversationId);
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(conversationSummary ? [{ role: 'system', content: `CONVERSATION CONTEXT:\n${conversationSummary}` }] : []),
      ...this._formatHistory(history),
      { role: 'user', content: message },
    ];

    let rounds = 0;
    let bookedAppointment = null;
    let emergencyTriggered = false;
    let availableDoctors = null;
    let lastAssistantMessage = '';
    const context = { userId: user.id, role: user.role, classification };

    while (rounds < MAX_TOOL_ROUNDS) {
      if (rounds > 0) await sleep(2000);
      rounds++;

      const isLastRound = rounds >= MAX_TOOL_ROUNDS;
      const genStart = new Date();

      try {
        const result = await this._callGroqStreaming(messages, {
          onToken: (token) => onToken(token),
          onToolStart: (toolName) => onToolStart(toolName),
        });
        const genEnd = new Date();

        obs.logGeneration(trace, {
          name: `groq-stream-round-${rounds}`,
          model: CHATBOT_MODEL,
          messages: messages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content.slice(0, 300) : '[structured]' })),
          output: result.content || '[tool_calls]',
          startTime: genStart,
          endTime: genEnd,
        });

        if (result.finishReason === 'tool_calls' && !isLastRound) {
          messages.push({ role: 'assistant', content: result.content || '', tool_calls: result.toolCalls });

          const toolResults = await Promise.all(
            result.toolCalls.map(async (tc) => {
              let args = {};
              try { args = JSON.parse(tc.function.arguments); } catch {}
              onToolStart(tc.function.name);
              const toolStart = Date.now();
              let toolResult = await executeTool(tc.function.name, args, context);
              obs.logToolCall(trace, { toolName: tc.function.name, args, result: toolResult, durationMs: Date.now() - toolStart });
              let content = JSON.stringify(toolResult);
              if (content.length > MAX_TOOL_OUTPUT_LENGTH) content = content.slice(0, MAX_TOOL_OUTPUT_LENGTH) + '... [Truncated]';
              if (tc.function.name === 'search_doctors' && Array.isArray(toolResult) && toolResult.length > 0) availableDoctors = toolResult;
              if (tc.function.name === 'book_appointment' && toolResult.success) bookedAppointment = toolResult;
              if (tc.function.name === 'trigger_emergency' && toolResult.triggered) emergencyTriggered = true;
              return { role: 'tool', tool_call_id: tc.id, content };
            })
          );
          messages.push(...toolResults);
          continue;
        }

        lastAssistantMessage = result.content || "I'm sorry, I couldn't process that. Could you rephrase?";
        break;
      } catch (err) {
        console.error('[LLM-STREAM-ERROR]', err.message);
        lastAssistantMessage = "I'm experiencing high traffic. Please try again in a few moments.";
        break;
      }
    }

    lastAssistantMessage = detectSensitiveLeak(lastAssistantMessage);
    lastAssistantMessage = applyOutputConstraints(lastAssistantMessage, classification);

    let validationResult = null;
    if (gateDecision.safetyPipelineTriggered) {
      const preValidation = lastAssistantMessage;
      validationResult = await validateResponse(message, lastAssistantMessage);
      lastAssistantMessage = validationResult.finalResponse;
      obs.logValidation(trace, {
        input: preValidation,
        output: validationResult.finalResponse,
        safe: validationResult.safe,
        issues: validationResult.issues,
      });
    }
    if (gateDecision.disclaimer) lastAssistantMessage += gateDecision.disclaimer;

    const finalResponse = this._buildResponse(lastAssistantMessage, bookedAppointment, availableDoctors, emergencyTriggered, classification, gateDecision, validationResult);
    obs.finalizeTrace(trace, {
      output: lastAssistantMessage,
      metadata: { intent: finalResponse.intent, safetyPipelineTriggered: finalResponse.safetyPipelineTriggered, rounds },
    });
    obs.flush();
    onComplete(finalResponse);
  }

  // ─── STREAMING GROQ CALL ─────────────────────────────────────────────────────

  async _callGroqStreaming(messages, { onToken }) {
    const model = CHATBOT_MODEL;

    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model, messages, tools: TOOL_DEFINITIONS, tool_choice: 'auto', temperature: 0.0, stream: true },
      {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        responseType: 'stream',
        timeout: 30000,
      }
    );

    return new Promise((resolve, reject) => {
      let buffer = '';
      let fullContent = '';
      let finishReason = null;
      // Accumulate tool call deltas by index
      const toolCallMap = {};

      res.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            const delta = parsed.choices?.[0]?.delta;
            finishReason = parsed.choices?.[0]?.finish_reason || finishReason;

            if (delta?.content) {
              fullContent += delta.content;
              onToken(delta.content);
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index;
                if (!toolCallMap[idx]) {
                  toolCallMap[idx] = { id: tc.id || '', function: { name: tc.function?.name || '', arguments: '' } };
                }
                if (tc.id) toolCallMap[idx].id = tc.id;
                if (tc.function?.name) toolCallMap[idx].function.name += tc.function.name;
                if (tc.function?.arguments) toolCallMap[idx].function.arguments += tc.function.arguments;
              }
            }
          } catch { /* skip malformed chunks */ }
        }
      });

      res.data.on('end', () => {
        const toolCalls = Object.values(toolCallMap);
        resolve({ finishReason, content: fullContent, toolCalls });
      });

      res.data.on('error', (err) => reject(err));
    });
  }

  _formatHistory(history) {
    // MINIMAL HISTORY: Only the very last exchange to stay under TPM limits
    return history.slice(-2).map(h => ({ role: h.role, content: h.content }));
  }

  async _callGroqWithRetry(messages, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      // On the final retry after a rate limit, fall back to the fast 8B model
      const model = i === retries ? CHATBOT_FALLBACK_MODEL : CHATBOT_MODEL;
      if (i === retries) {
        console.warn(`[Groq] Falling back to ${CHATBOT_FALLBACK_MODEL} after rate limit on ${CHATBOT_MODEL}`);
      }
      try {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model,
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
          console.warn(`[Groq] 429 Rate Limit on ${model}. Retrying in ${wait}ms...`);
          await sleep(wait);
          continue;
        }
        throw err;
      }
    }
  }
  _buildResponse(message, booking, doctors, emergency, classification = null, gateDecision = null, validationResult = null) {
    return {
      message,
      isEmergency: !!emergency,
      intent: emergency ? 'EMERGENCY' : (booking ? 'BOOKING' : (doctors ? 'MATCHMAKING' : 'GENERAL')),
      classification: classification
        ? { intent: classification.intent, riskLevel: classification.riskLevel }
        : null,
      safetyPipelineTriggered: gateDecision?.safetyPipelineTriggered ?? false,
      validated: validationResult?.validated ?? false,
      availableDoctors: doctors || null,
      bookingDetails: booking || null,
    };
  }
}

module.exports = new ChatbotService();
