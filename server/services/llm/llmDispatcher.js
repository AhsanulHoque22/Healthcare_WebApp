const axios = require('axios');

/**
 * llmDispatcher.js
 * 
 * Unified dispatcher to handle Multi-Provider Fallback (Groq -> Gemini -> OpenRouter).
 * Supports streaming and tool-calling across OpenAI-compatible providers.
 */

const PROVIDERS = {
  GROQ: {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: () => process.env.GROQ_API_KEY,
    model: 'llama-3.3-70b-versatile'
  },
  GEMINI: {
    name: 'Gemini',
    // Google AI Studio OpenAI Compatibility
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    key: () => process.env.GEMINI_API_KEY,
    model: 'gemini-1.5-pro'
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
              }
              if (tc.id) toolCallMap[idx].id = tc.id;
              if (tc.function?.name) {
                const oldName = toolCallMap[idx].function.name;
                toolCallMap[idx].function.name += tc.function.name;
                if (!oldName && toolCallMap[idx].function.name) onToolStart(toolCallMap[idx].function.name);
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
async function callStandard(providerKey, messages, tools) {
  const provider = PROVIDERS[providerKey];
  const apiKey = provider.key();
  
  const payload = {
    model: provider.model,
    messages,
    temperature: 0.0,
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
  }

  const res = await axios.post(provider.url, payload, {
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 25000,
  });

  const choice = res.data.choices[0];
  return { ...choice, provider: provider.name };
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
      console.log(`[Dispatcher] Attempting ${p}...`);
      return await callStreaming(p, messages, tools, options);
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      console.error(`[Dispatcher] ${p} failed (Status: ${status || 'Err'}):`, err.message);
      
      // If it's a 401/403 or context limit, we definitely want to skip. 429 is the main trigger.
      if (status === 429 || status >= 500 || err.code === 'ECONNABORTED') {
        continue; // Try next provider
      }
      throw err; // Critical error, abort
    }
  }

  throw lastError || new Error("All LLM providers failed.");
}

async function callWithFallbackStandard(messages, tools) {
  const chain = ['GROQ', 'GEMINI', 'OPENROUTER'];
  let lastError = null;

  for (const p of chain) {
    try {
      if (!PROVIDERS[p].key()) continue;
      return await callStandard(p, messages, tools);
    } catch (err) {
      lastError = err;
      if (err.response?.status === 429 || err.response?.status >= 500) continue;
      throw err;
    }
  }
  throw lastError || new Error("All LLM providers failed.");
}

module.exports = { callWithFallback, callWithFallbackStandard, PROVIDERS };
