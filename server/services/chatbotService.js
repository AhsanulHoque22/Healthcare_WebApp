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
const { getPatientContext, updatePatientContext } = require('./chatbot/patientMemory');
const obs = require('./chatbot/observability');

// 70B for clinical reasoning accuracy; 8B fallback only when rate-limited
const CHATBOT_MODEL = process.env.GROQ_CHATBOT_MODEL || 'llama-3.3-70b-versatile';
const CHATBOT_FALLBACK_MODEL = 'llama-3.1-8b-instant';
const MAX_TOOL_ROUNDS = 5;
const MAX_TOOL_OUTPUT_LENGTH = 800;
const sleep = (ms) => new Promise(res => setTimeout(res, ms));

// Intent → tool name allowlist. Keeps each Groq call to only the tools it needs,
// cutting token usage from ~2,100 (all 16 tools) to ~200–600 per request.
const INTENT_TOOL_MAP = {
  EMERGENCY:        ['trigger_emergency'],
  APPOINTMENT:      ['get_appointments', 'search_doctors', 'book_appointment', 'cancel_appointment', 'reschedule_appointment'],
  PERSONAL_DATA:    ['get_patient_profile', 'generate_medical_summary', 'get_prescriptions', 'get_active_medicines', 'get_lab_orders', 'get_medical_records', 'analyze_medical_document'],
  DRUG_INTERACTION: ['check_drug_interaction', 'get_active_medicines'],
  DOSAGE:           ['get_dosage_info', 'get_active_medicines'],
  MEDICAL_QA:       ['search_medical_knowledge'],
  DIAGNOSIS:        ['search_medical_knowledge', 'get_patient_profile', 'generate_medical_summary'],
  GENERAL:          ['generate_medical_summary', 'get_patient_profile', 'get_appointments', 'search_doctors', 'search_medical_knowledge'],
};

const SYSTEM_PROMPT = `
You are **Livora AI**, a sophisticated, empathetic, and evidence-based healthcare assistant. Your goal is to simplify the user's healthcare journey by providing fast, accurate data retrieval and clinical guidance.

### 🛡️ OPERATIONAL CONSTRAINTS:
1. **Tool-First Reasoning**: For data-seeking or health-related queries, always check if a tool can answer the question before responding.
2. **Greetings**: If the user just says "hello", "hi", or similar without any health query, DO NOT call any data-retrieval tools. Just greet them warmly and ask how you can help.
3. **Handle Vague Intent**: Proactively map vague user queries (e.g., "how am I doing?", "show my status") to specific tools like \`generate_medical_summary\`.
4. **Medical Knowledge**: If a user asks a general health question, use the \`search_medical_knowledge\` tool.
5. **Safety & Dosage**: Never prescribe. Use \`trigger_emergency\` for severe symptoms. ALWAYS use tools for drug interactions and dosage — NEVER guess.
6. **Privacy**: Only disclose personal health data when specifically requested or when providing a summary the user asked for.

### 🧩 FEW-SHOT EXAMPLES:

**Example 0: Simple Greeting**
*User*: "Hi there"
*Thought*: Simple greeting. No health data requested.
*Action*: No tool call.
*Response*: "Hello! I'm Livora, your healthcare assistant. How can I help you with your health today?"

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

    // Inject rolling conversation summary and long-term patient context so
    // returning patients don't re-explain conditions, allergies, or medications
    const [conversationSummary, patientContext] = await Promise.all([
      getLatestSummary(user.id, conversationId),
      getPatientContext(user.id),
    ]);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(patientContext ? [{ role: 'system', content: patientContext }] : []),
      ...(conversationSummary
        ? [{ role: 'system', content: `CONVERSATION CONTEXT (summary of earlier exchanges):\n${conversationSummary}` }]
        : []),
      ...this._formatHistory(history),
      { role: 'user', content: message },
    ];

    const filteredTools = this._getToolsForIntent(classification.intent);
    console.log(`[Tools] intent=${classification.intent} → ${filteredTools.length} tools (was 16)`);

    let rounds = 0;
    let lastAssistantMessage = null;
    let bookedAppointment = null;
    let emergencyTriggered = false;
    let availableDoctors = null;
    const seenToolCalls = new Set();

    const context = { userId: user.id, role: user.role, classification };

    while (rounds < MAX_TOOL_ROUNDS) {
      rounds++;

      // Inject reflection prompt on the penultimate round to push the model to answer
      if (rounds === MAX_TOOL_ROUNDS - 1) {
        messages.push({
          role: 'system',
          content: 'You have used most available reasoning rounds. Based on all tool results collected so far, provide a complete and final answer to the user now. Only call another tool if absolutely critical.',
        });
      }

      let llmResponse;
      const genStart = new Date();
      try {
        llmResponse = await this._callGroqWithRetry(messages, filteredTools);
      } catch (err) {
        console.error('[LLM-ERROR]', err.message);
        obs.finalizeTrace(trace, { output: null, metadata: { error: err.message } });
        obs.flush();
        return this._buildResponse(
          "I'm sorry, the AI service is temporarily unavailable. Please try again in a moment.",
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
              args = args || {};
            } catch (e) {
              args = {};
            }

            // Loop detection: skip duplicate tool+args combinations
            const callKey = `${toolName}:${tc.function.arguments}`;
            if (seenToolCalls.has(callKey)) {
              console.warn(`[LoopDetect] Skipping duplicate call: ${toolName}`);
              return { role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ note: 'Already retrieved — use the previous result.' }) };
            }
            seenToolCalls.add(callKey);

            const toolStart = Date.now();
            let result = await executeTool(toolName, args, context);
            obs.logToolCall(trace, { toolName, args, result, durationMs: Date.now() - toolStart });

            let content = JSON.stringify(result);
            if (content.length > MAX_TOOL_OUTPUT_LENGTH) {
              content = content.substring(0, MAX_TOOL_OUTPUT_LENGTH) + '... [Truncated]';
            }

            if (toolName === 'search_doctors' && result.length > 0) availableDoctors = result;
            if (toolName === 'book_appointment' && result.success) bookedAppointment = result;
            if (toolName === 'trigger_emergency' && result.triggered) emergencyTriggered = true;

            return { role: 'tool', tool_call_id: tc.id, content };
          })
        );

        messages.push(...toolResults);

        if (rounds >= MAX_TOOL_ROUNDS) {
          lastAssistantMessage = choice.message.content || 'I have gathered all available information. Please ask a more specific question if you need further details.';
          break;
        }
        continue;
      }

      lastAssistantMessage = choice.message.content;
      break;
    }

    // Fire-and-forget: persist any new medical facts for future sessions
    updatePatientContext(user.id, messages).catch(err => console.warn('[PatientMemory]', err.message));

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

    try {
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

      const [conversationSummary, patientContext] = await Promise.all([
        getLatestSummary(user.id, conversationId),
        getPatientContext(user.id),
      ]);

      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(patientContext ? [{ role: 'system', content: patientContext }] : []),
        ...(conversationSummary ? [{ role: 'system', content: `CONVERSATION CONTEXT:\n${conversationSummary}` }] : []),
        ...this._formatHistory(history),
        { role: 'user', content: message },
      ];

      const filteredTools = this._getToolsForIntent(classification.intent);
      console.log(`[Tools] stream intent=${classification.intent} → ${filteredTools.length} tools`);

      let rounds = 0;
      let bookedAppointment = null;
      let emergencyTriggered = false;
      let availableDoctors = null;
      let lastAssistantMessage = '';
      const seenToolCalls = new Set();
      const context = { userId: user.id, role: user.role, classification };

      while (rounds < MAX_TOOL_ROUNDS) {
        rounds++;
        const isLastRound = rounds >= MAX_TOOL_ROUNDS;

        if (rounds === MAX_TOOL_ROUNDS - 1) {
          messages.push({
            role: 'system',
            content: 'You have used most available reasoning rounds. Based on all tool results collected so far, provide a complete and final answer to the user now. Only call another tool if absolutely critical.',
          });
        }

        const genStart = new Date();
        let result;
        let useFallback = false;

        try {
          result = await this._callGroqStreaming(messages, filteredTools, {
            onToken: (token) => onToken(token),
            onToolStart: (toolName) => onToolStart(toolName),
            model: CHATBOT_MODEL
          });
        } catch (err) {
          const is429 = err.response?.status === 429;
          if (is429) {
            console.warn(`[Groq-Stream] 429 on ${CHATBOT_MODEL}, retrying with fallback ${CHATBOT_FALLBACK_MODEL}`);
            result = await this._callGroqStreaming(messages, filteredTools, {
              onToken: (token) => onToken(token),
              onToolStart: (toolName) => onToolStart(toolName),
              model: CHATBOT_FALLBACK_MODEL
            });
            useFallback = true;
          } else {
            throw err;
          }
        }

        const genEnd = new Date();

        obs.logGeneration(trace, {
          name: `groq-stream-round-${rounds}`,
          model: useFallback ? CHATBOT_FALLBACK_MODEL : CHATBOT_MODEL,
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

              const callKey = `${tc.function.name}:${tc.function.arguments}`;
              if (seenToolCalls.has(callKey)) {
                console.warn(`[LoopDetect] Skipping duplicate stream call: ${tc.function.name}`);
                return { role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ note: 'Already retrieved — use the previous result.' }) };
              }
              seenToolCalls.add(callKey);

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
      }

      updatePatientContext(user.id, messages).catch(err => console.warn('[PatientMemory]', err.message));

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

    } catch (error) {
      if (error.response?.data) {
        try {
          if (typeof error.response.data.on === 'function') {
            console.error('[LLM-STREAM-ERROR] Status:', error.response.status);
            error.response.data.on('data', chunk => {
              console.error('[LLM-STREAM-ERROR] Response body chunk:', chunk.toString());
            });
          } else {
            console.error('[LLM-STREAM-ERROR] Status:', error.response.status, 'Data:', JSON.stringify(error.response.data, null, 2));
          }
        } catch (e) {
          console.error('[LLM-STREAM-ERROR] Could not log error response:', e.message);
        }
      } else {
        console.error('[LLM-STREAM-ERROR]', error.message);
      }
      const lastAssistantMessage = "I'm sorry, the AI service is temporarily unavailable. Please try again in a moment.";
      onComplete({ ...this._buildResponse(lastAssistantMessage, null, null, false), error: true });
    }
  }

  // ─── STREAMING GROQ CALL ─────────────────────────────────────────────────────

  async _callGroqStreaming(messages, tools, { onToken, onToolStart, model = CHATBOT_MODEL }) {

    const payload = {
      model,
      messages,
      temperature: 0.0,
      stream: true
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = 'auto';
    }

    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      payload,
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
    // Ensure content is always a string to prevent LLM errors (e.g. if content was null in DB)
    return history.slice(-2).map(h => ({
      role: h.role,
      content: typeof h.content === 'string' ? h.content : (h.content ? String(h.content) : '')
    }));
  }

  _getToolsForIntent(intent) {
    const names = INTENT_TOOL_MAP[intent] || INTENT_TOOL_MAP.GENERAL;
    const nameSet = new Set(names);
    return TOOL_DEFINITIONS.filter(t => nameSet.has(t.function.name));
  }

  async _callGroqWithRetry(messages, tools, retries = 3) {
    let useFallback = false;
    for (let i = 0; i <= retries; i++) {
      const model = useFallback ? CHATBOT_FALLBACK_MODEL : CHATBOT_MODEL;
      const payload = {
        model,
        messages,
        temperature: 0.0,
      };

      if (tools && tools.length > 0) {
        payload.tools = tools;
        payload.tool_choice = 'auto';
      }

      try {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', payload, {
          headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          timeout: 25000,
        });
        return res.data;
      } catch (err) {
        const is429 = err.response?.status === 429;
        if (is429 && i < retries) {
          // Switch to 8B immediately on first rate limit hit
          if (!useFallback) {
            console.warn(`[Groq] 429 on ${CHATBOT_MODEL}, switching to ${CHATBOT_FALLBACK_MODEL}`);
            useFallback = true;
          }
          // Respect the retry-after header Groq sends; default to 15s
          const retryAfter = parseInt(err.response?.headers?.['retry-after'] || '15', 10);
          const waitMs = Math.min(retryAfter * 1000, 60000);
          console.warn(`[Groq] Waiting ${waitMs}ms before retry (retry-after: ${retryAfter}s)`);
          await sleep(waitMs);
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
