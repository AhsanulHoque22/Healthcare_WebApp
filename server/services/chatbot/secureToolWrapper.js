/**
 * secureToolWrapper.js
 * 
 * High-security execution wrapper for chatbot tools.
 */

const { checkRateLimit } = require('./chatbotRateLimiter');
const { enforceAccess } = require('./chatbotAuth');
const { sanitizeOutput } = require('./chatbotSanitizer');
const { logToolCall } = require('./chatbotLogger');

async function secureExecute(toolFn, toolName, params, context) {
  const { userId, role } = context;
  const startTime = Date.now();
  let status = 'success';
  let result = null;
  let errorMsg = null;

  try {
    // 1. Rate Limiting
    checkRateLimit(userId, toolName);

    // 2. Authorization (RBAC/ABAC)
    await enforceAccess({ userId, role, toolName, params });

    // 3. Execution
    result = await toolFn(params, userId);

    // 4. Sanitization
    result = sanitizeOutput(toolName, result);

  } catch (err) {
    status = 'fail';
    errorMsg = err.message;
    console.error(`[SECURE-EXECUTE] '${toolName}' failed:`, err.message);
    
    // Return safe errors to the AI
    result = { 
      error: true, 
      message: err.message.includes("Access Denied") || err.message.includes("Rate limit") 
               ? err.message 
               : "Data retrieval failed due to a system constraint."
    };
  } finally {
    // 5. Audit Logging
    const duration = Date.now() - startTime;
    logToolCall({
      userId,
      role,
      tool: toolName,
      params,
      status,
      duration,
      error: errorMsg
    });
  }

  return result;
}

module.exports = { secureExecute };
