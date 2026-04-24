'use strict';

/**
 * Langfuse observability wrapper.
 * All functions are no-ops when LANGFUSE_SECRET_KEY / LANGFUSE_PUBLIC_KEY are absent,
 * so the rest of the codebase needs no conditional checks.
 */

let _client = null;
let _initAttempted = false;

function _getClient() {
  if (_initAttempted) return _client;
  _initAttempted = true;

  const pub = process.env.LANGFUSE_PUBLIC_KEY;
  const sec = process.env.LANGFUSE_SECRET_KEY;
  if (!pub || !sec) return null;

  try {
    const { Langfuse } = require('langfuse');
    _client = new Langfuse({
      publicKey: pub,
      secretKey: sec,
      baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
      flushAt: 10,
      flushInterval: 3000,
    });
    console.log('[Langfuse] Observability enabled');
  } catch (e) {
    console.warn('[Langfuse] Init failed — observability disabled:', e.message);
  }
  return _client;
}

/**
 * Start a trace for one chatbot conversation turn.
 * Returns an opaque handle passed to other helpers.
 * Returns null when Langfuse is not configured.
 */
function startTrace({ userId, sessionId, userMessage, metadata = {} }) {
  const lf = _getClient();
  if (!lf) return null;
  try {
    return lf.trace({
      name: 'chatbot-turn',
      userId: String(userId),
      sessionId: sessionId || undefined,
      input: userMessage,
      metadata,
    });
  } catch { return null; }
}

/**
 * Record the intent classification step.
 */
function logClassification(trace, { input, output, durationMs }) {
  if (!trace) return;
  try {
    trace.span({
      name: 'intent-classification',
      input,
      output,
      metadata: { durationMs },
    });
  } catch {}
}

/**
 * Record the gate evaluation step.
 */
function logGateDecision(trace, { classification, decision }) {
  if (!trace) return;
  try {
    trace.span({
      name: 'critical-question-gate',
      input: classification,
      output: decision,
    });
  } catch {}
}

/**
 * Record one LLM completion (generation).
 * usageTokens = { promptTokens, completionTokens, totalTokens } from Groq response.
 */
function logGeneration(trace, { name, model, messages, output, usageTokens, startTime, endTime }) {
  if (!trace) return;
  try {
    trace.generation({
      name: name || 'groq-completion',
      model,
      input: messages,
      output,
      usage: usageTokens
        ? { input: usageTokens.prompt_tokens, output: usageTokens.completion_tokens, total: usageTokens.total_tokens }
        : undefined,
      startTime,
      endTime,
    });
  } catch {}
}

/**
 * Record a single tool call and its result.
 */
function logToolCall(trace, { toolName, args, result, durationMs }) {
  if (!trace) return;
  try {
    trace.span({
      name: `tool:${toolName}`,
      input: args,
      output: result,
      metadata: { durationMs },
    });
  } catch {}
}

/**
 * Record the second-opinion validation step.
 */
function logValidation(trace, { input, output, safe, issues }) {
  if (!trace) return;
  try {
    trace.span({
      name: 'response-validation',
      input,
      output,
      metadata: { safe, issues },
    });
  } catch {}
}

/**
 * Finalize the trace with the assistant's final reply and outcome.
 * Call this right before returning the response.
 */
function finalizeTrace(trace, { output, metadata = {} }) {
  if (!trace) return;
  try {
    trace.update({ output, metadata });
  } catch {}
}

/**
 * Flush buffered events — call fire-and-forget at the end of a request.
 */
function flush() {
  const lf = _getClient();
  if (!lf) return;
  lf.flushAsync().catch(() => {});
}

module.exports = {
  startTrace,
  logClassification,
  logGateDecision,
  logGeneration,
  logToolCall,
  logValidation,
  finalizeTrace,
  flush,
};
