const axios = require('axios');

/**
 * llmDispatcher.js
 *
 * Unified dispatcher: Groq -> Gemini -> OpenRouter with circuit-breaker cooldowns.
 * When a provider 429s, its cooldown is recorded so the next call skips it instantly
 * instead of wasting an HTTP round-trip to get the same error back.
 */

// providerKey -> Date.now() timestamp at which the cooldown expires
const _cooldowns = new Map();

function _setCooldown(providerKey, retryAfterSeconds) {
  const ms = (retryAfterSeconds > 0 ? retryAfterSeconds : 3600) * 1000;
  _cooldowns.set(providerKey, Date.now() + ms);
  console.warn(`[Dispatcher] ${providerKey} on cooldown for ${Math.ceil(ms / 60000)} min.`);
}

function _isOnCooldown(providerKey) {
  const until = _cooldowns.get(providerKey);
  if (!until) return false;
  if (Date.now() >= until) { _cooldowns.delete(providerKey); return false; }
  return true;
}

// Parse seconds-to-wait from the retry-after header or the Groq error message body
function _parseRetryAfter(err) {
  const headerVal = err.response?.headers?.['retry-after'] || err.response?.headers?.['x-ratelimit-reset-requests'];
  if (headerVal) {
    const secs = parseInt(headerVal, 10);
    if (!isNaN(secs)) return secs;
  }
  // Groq embeds "Please try again in Xm Y.Zs" in the error message
  const msg = err.response?.data?.error?.message || '';
  const match = msg.match(/try again in (?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?/i);
  if (match) {
    const mins = parseInt(match[1] || '0', 10);
    const secs = parseFloat(match[2] || '0');
    return mins * 60 + Math.ceil(secs);
  }
  return 3600; // default: 1 hour for unknown TPD limits
}

const PROVIDERS = {
  GROQ: {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: () => process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile'
  },
  GEMINI: {
    name: 'Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    key: () => process.env.GEMINI_API_KEY,
    model: 'gemini-2.0-flash'
  },
  OPENROUTER: {
    name: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    key: () => process.env.OPENROUTER_API_KEY,
    model: 'meta-llama/llama-3.3-70b-instruct'
  }
};

/**
 * Calls an OpenAI-compatible endpoint with streaming support.
 */
async function callStreaming(providerKey, messages, tools, { onToken, onToolStart }) {
  const provider = PROVIDERS[providerKey];
  if (!provider) throw new Error(`Invalid provider: ${providerKey}`);
  
  const apiKey = provider.key();
  if (!apiKey) throw new Error(`API Key missing for provider: ${provider.name}`);

  const payload = {
    model: provider.model,
    messages,
    temperature: 0.0, // Clinical rigor
    stream: true
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
  }

  const res = await axios.post(
    provider.url,
    payload,
    {
      headers: { 
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://livora.health', // Required for OpenRouter
        'X-Title': 'Livora Healthcare' 
      },
      responseType: 'stream',
      timeout: 30000,
    }
  );

  return new Promise((resolve, reject) => {
    let buffer = '';
    let fullContent = '';
    let finishReason = null;
    const toolCallMap = {};

    res.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || line.includes(': ping')) continue;
        const cleanLine = line.replace(/^data: /, '').trim();
        if (cleanLine === '[DONE]') continue;

        try {
          const parsed = JSON.parse(cleanLine);
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
                if (tc.function?.name) onToolStart(tc.function.name);
              } else {
                if (tc.id) toolCallMap[idx].id = tc.id;
                if (tc.function?.name && !toolCallMap[idx].function.name) {
                  toolCallMap[idx].function.name = tc.function.name;
                  onToolStart(tc.function.name);
                }
              }
              if (tc.function?.arguments) toolCallMap[idx].function.arguments += tc.function.arguments;
            }
          }
        } catch { /* skip partials */ }
      }
    });

    res.data.on('end', () => {
      resolve({ 
        finishReason, 
        content: fullContent, 
        toolCalls: Object.values(toolCallMap),
        provider: provider.name
      });
    });

    res.data.on('error', (err) => reject(err));
  });
}

/**
 * Standard (non-streaming) completion
 */
async function callStandard(providerKey, messages, tools, { temperature = 0.0, maxTokens, timeoutMs = 25000 } = {}) {
  const provider = PROVIDERS[providerKey];
  const apiKey = provider.key();

  const payload = {
    model: provider.model,
    messages,
    temperature,
  };

  if (maxTokens) payload.max_tokens = maxTokens;

  if (tools && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
  }

  const res = await axios.post(provider.url, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://livora.health',
      'X-Title': 'Livora Healthcare',
    },
    timeout: timeoutMs,
  });

  const choice = res.data.choices[0];
  return { 
    ...choice,
    content: choice.message.content,
    toolCalls: choice.message.tool_calls || [],
    provider: provider.name 
  };
}

/**
 * Chainable fallback logic: Groq -> Gemini -> OpenRouter
 */
async function callWithFallback(messages, tools, options) {
  const chain = ['GROQ', 'GEMINI', 'OPENROUTER'];
  let lastError = null;

  for (const p of chain) {
    try {
      if (!PROVIDERS[p].key()) {
        console.warn(`[Dispatcher] Skipping ${p} - Key not configured.`);
        continue;
      }
      if (_isOnCooldown(p)) {
        console.warn(`[Dispatcher] Skipping ${p} - on cooldown.`);
        continue;
      }
      console.log(`[Dispatcher] Attempting ${p}...`);
      return await callStreaming(p, messages, tools, options);
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const errBody = err.response?.data ? JSON.stringify(err.response.data).slice(0, 300) : '';
      console.error(`[Dispatcher] ${p} failed (Status: ${status || 'Err'}):`, err.message);
      if (errBody) console.error(`[Dispatcher] ${p} error body:`, errBody);
      if (status === 429) _setCooldown(p, _parseRetryAfter(err));
      if (status === 400 || status === 404 || status === 429 || status >= 500 || err.code === 'ECONNABORTED') {
        continue;
      }
      throw err; // 401/403 = bad key, abort immediately
    }
  }

  throw lastError || new Error("All LLM providers failed.");
}

async function callWithFallbackStandard(messages, tools, options = {}) {
  const chain = ['GROQ', 'GEMINI', 'OPENROUTER'];
  let lastError = null;

  for (const p of chain) {
    try {
      if (!PROVIDERS[p].key()) {
        console.warn(`[Dispatcher] Skipping ${p} - Key not configured.`);
        continue;
      }
      if (_isOnCooldown(p)) {
        console.warn(`[Dispatcher] Skipping ${p} - on cooldown.`);
        continue;
      }
      console.log(`[Dispatcher] Attempting ${p} (standard)...`);
      return await callStandard(p, messages, tools, options);
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const errBody = err.response?.data ? JSON.stringify(err.response.data).slice(0, 300) : '';
      console.error(`[Dispatcher] ${p} failed (Status: ${status || 'Err'}):`, err.message, errBody || '');
      if (status === 429) _setCooldown(p, _parseRetryAfter(err));
      if (status === 400 || status === 404 || status === 429 || status >= 500 || err.code === 'ECONNABORTED') continue;
      throw err;
    }
  }
  throw lastError || new Error("All LLM providers failed.");
}

module.exports = { callWithFallback, callWithFallbackStandard, PROVIDERS };
