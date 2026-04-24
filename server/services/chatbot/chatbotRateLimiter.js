/**
 * chatbotRateLimiter.js
 *
 * Redis-backed sliding window rate limiter for the chatbot.
 * Replaces the previous in-memory Map implementation which reset on every
 * process restart and silently failed across multiple server instances.
 *
 * Fails open: if Redis is unavailable, requests are allowed through and a
 * warning is logged — degraded limiting is better than blocking all users.
 */

const Redis = require('ioredis');

const LIMITS = {
  user: 60,   // max chatbot calls per user per hour
  tool: 200,  // max calls per tool per user per hour
  windowSec: 60 * 60,
};

// ── Redis connection ──────────────────────────────────────────────────────────

let redis = null;
let redisAvailable = false;

function _getRedis() {
  if (redis) return redis;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  redis = new Redis(url, {
    lazyConnect: true,
    enableOfflineQueue: false,  // fail fast, don't queue commands when down
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      // Back off up to 30s, then stop retrying
      if (times > 5) return null;
      return Math.min(times * 1000, 30000);
    },
  });

  redis.on('connect', () => {
    redisAvailable = true;
    console.log('[RateLimiter] Redis connected.');
  });

  redis.on('error', (err) => {
    if (redisAvailable) {
      console.warn('[RateLimiter] Redis error — falling back to fail-open:', err.message);
    }
    redisAvailable = false;
  });

  redis.on('close', () => {
    redisAvailable = false;
  });

  // Connect in background — don't block module load
  redis.connect().catch(() => {});

  return redis;
}

// ── In-memory fallback (single-instance only) ─────────────────────────────────
// Used when Redis is unavailable so the service keeps running

const _memoryCounters = new Map();

function _memoryCheck(key, limit, windowMs) {
  const now = Date.now();
  const entry = _memoryCounters.get(key);

  if (!entry || now - entry.resetAt > windowMs) {
    _memoryCounters.set(key, { count: 1, resetAt: now });
    return 1;
  }

  entry.count++;
  return entry.count > limit ? limit + 1 : entry.count;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Checks and increments rate limit counters for a user + tool pair.
 * Throws if either limit is exceeded.
 *
 * @param {string|number} userId
 * @param {string} toolName
 */
async function checkRateLimit(userId, toolName) {
  const userKey = `ratelimit:chatbot:user:${userId}`;
  const toolKey = `ratelimit:chatbot:tool:${toolName}:${userId}`;
  const windowMs = LIMITS.windowSec * 1000;

  const client = _getRedis();

  if (!redisAvailable) {
    // Fail-open: use in-memory fallback
    const userCount = _memoryCheck(userKey, LIMITS.user, windowMs);
    if (userCount > LIMITS.user) throw new Error('Rate limit exceeded. Please wait a while.');

    const toolCount = _memoryCheck(toolKey, LIMITS.tool, windowMs);
    if (toolCount > LIMITS.tool) throw new Error(`High traffic for ${toolName}. Try again later.`);

    return true;
  }

  try {
    // Sliding window using Redis INCR + EXPIRE
    // Both commands run in a pipeline for atomic-ish behaviour
    const pipeline = client.pipeline();
    pipeline.incr(userKey);
    pipeline.expire(userKey, LIMITS.windowSec, 'NX'); // set TTL only on first incr
    pipeline.incr(toolKey);
    pipeline.expire(toolKey, LIMITS.windowSec, 'NX');
    const results = await pipeline.exec();

    const userCount = results[0][1];
    const toolCount = results[2][1];

    if (userCount > LIMITS.user) {
      throw new Error('Rate limit exceeded. Please wait a while.');
    }
    if (toolCount > LIMITS.tool) {
      throw new Error(`High traffic for ${toolName}. Try again later.`);
    }

    return true;
  } catch (err) {
    // If it's our own rate-limit error, re-throw
    if (err.message.includes('Rate limit') || err.message.includes('High traffic')) {
      throw err;
    }
    // Redis command failure — fail open
    console.warn('[RateLimiter] Redis command failed, failing open:', err.message);
    return true;
  }
}

module.exports = { checkRateLimit };
