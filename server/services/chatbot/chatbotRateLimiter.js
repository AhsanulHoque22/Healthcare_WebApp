/**
 * chatbotRateLimiter.js
 * 
 * Rate limiting for chatbot users and specific tools.
 */

const userQuotas = new Map(); // userId -> { count, lastReset }
const toolQuotas = new Map(); // toolName -> { count, lastReset }

const LIMITS = {
  user: 60, // 60 calls per hour
  tool: 200, // 200 global calls per tool per hour
  window: 60 * 60 * 1000 // 1 hour
};

function checkRateLimit(userId, toolName) {
  const now = Date.now();

  // 1. User Limit
  let user = userQuotas.get(userId);
  if (!user || now - user.lastReset > LIMITS.window) {
    user = { count: 0, lastReset: now };
  }
  user.count++;
  userQuotas.set(userId, user);
  if (user.count > LIMITS.user) throw new Error("Rate limit exceeded. Please wait a while.");

  // 2. Tool Limit
  let tool = toolQuotas.get(toolName);
  if (!tool || now - tool.lastReset > LIMITS.window) {
    tool = { count: 0, lastReset: now };
  }
  tool.count++;
  toolQuotas.set(toolName, tool);
  if (tool.count > LIMITS.tool) throw new Error(`High traffic for ${toolName}. Try again later.`);

  return true;
}

module.exports = { checkRateLimit };
