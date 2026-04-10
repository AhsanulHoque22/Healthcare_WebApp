/**
 * chatbotLogger.js
 * 
 * Structured audit logging for all tool calls.
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs/chatbot');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function logToolCall({ userId, role, tool, params, status, duration, error }) {
  const entry = {
    timestamp: new Date().toISOString(),
    userId,
    role,
    tool,
    params: sanitizeParams(params),
    status,
    duration: `${duration}ms`,
    error: error || null
  };

  const file = path.join(LOG_DIR, `audit-${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFile(file, JSON.stringify(entry) + '\n', (err) => {
    if (err) console.error("[AUDIT-LOG-ERROR]", err);
  });
}

function sanitizeParams(params) {
  if (!params) return null;
  const sanitized = { ...params };
  const sensitive = ['password', 'token', 'secret'];
  sensitive.forEach(k => delete sanitized[k]);
  return sanitized;
}

module.exports = { logToolCall };
