const axios = require('axios');

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';

const LLAMA_MODELS = Object.freeze({
  documentExtraction: process.env.GROQ_DEEP_MEDICAL_MODEL || 'llama-3.3-70b-versatile',
  patientInsight: process.env.GROQ_FAST_INSIGHT_MODEL || 'llama-3.1-8b-instant',
  documentVision: process.env.GROQ_VISION_MODEL || 'llama-3.2-90b-vision-preview',
  // Fallback models for when rate limits are hit
  documentExtractionSmall: 'llama-3.1-8b-instant',
  patientInsightSmall: 'llama-3.1-8b-instant'
});

const MODEL_VERSIONS = Object.freeze({
  documentExtraction: `groq/${LLAMA_MODELS.documentExtraction}:livora-medical-v1`,
  patientInsight: `groq/${LLAMA_MODELS.patientInsight}:livora-summary-v1`,
  documentVision: `groq/${LLAMA_MODELS.documentVision}:livora-vision-v1`,
  documentExtractionSmall: `groq/${LLAMA_MODELS.documentExtractionSmall}:livora-medical-small`,
  patientInsightSmall: `groq/${LLAMA_MODELS.patientInsightSmall}:livora-summary-small`
});

function hasGroqApiKey() {
  return Boolean(process.env.GROQ_API_KEY);
}

function assertGroqApiKey() {
  if (!hasGroqApiKey()) {
    throw new Error('GROQ_API_KEY is not configured.');
  }
}

async function createChatCompletion({
  model,
  messages,
  temperature = 0.1,
  maxTokens = 1200,
  timeoutMs = 15000,
  fallbackModel = null
}) {
  assertGroqApiKey();

  try {
    const response = await axios.post(
      GROQ_CHAT_COMPLETIONS_URL,
      {
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: timeoutMs
      }
    );

    return response.data?.choices?.[0]?.message?.content?.trim() || '';
  } catch (error) {
    // Check for rate limit errors
    const isRateLimited = error.response?.data?.error?.code === 'rate_limit_exceeded';
    
    if (isRateLimited) {
      console.warn(`[Groq Rate Limit] Model ${model}: ${error.response.data.error.message}`);
      
      // If fallback model provided and rate limited, try with smaller model
      if (fallbackModel && fallbackModel !== model) {
        console.log(`[Groq Fallback] Retrying with smaller model: ${fallbackModel}`);
        try {
          const fallbackResponse = await axios.post(
            GROQ_CHAT_COMPLETIONS_URL,
            {
              model: fallbackModel,
              messages,
              temperature,
              max_tokens: maxTokens
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: timeoutMs
            }
          );
          console.log(`[Groq Fallback] ✅ Succeeded with ${fallbackModel}`);
          return fallbackResponse.data?.choices?.[0]?.message?.content?.trim() || '';
        } catch (fallbackError) {
          console.error(`[Groq Fallback] Failed with ${fallbackModel}:`, fallbackError.response?.data?.error?.message);
        }
      }
    }
    
    // Log detailed error information for debugging
    if (error.response?.data?.error) {
      console.error('[Groq API Error]', JSON.stringify(error.response.data.error, null, 2));
    }
    if (error.response?.status === 400) {
      const messages_info = messages.map(m => ({
        role: m.role,
        contentLength: typeof m.content === 'string' ? m.content.length : 'array'
      }));
      console.error('[Groq 400 Error] Messages:', JSON.stringify(messages_info, null, 2));
    }
    throw error;
  }
}

function extractJsonFromText(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty model response.');
  }

  const normalized = text
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(normalized);
  } catch (directParseError) {
    const objectMatch = normalized.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }

    const arrayMatch = normalized.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }

    throw directParseError;
  }
}

async function requestStructuredJson({
  model,
  systemPrompt,
  userPrompt,
  userContent,
  temperature = 0.1,
  maxTokens = 1600,
  timeoutMs = 20000,
  fallbackModel = null
}) {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  if (userContent) {
    messages.push({ role: 'user', content: userContent });
  } else {
    messages.push({ role: 'user', content: userPrompt });
  }

  const content = await createChatCompletion({
    model,
    messages,
    temperature,
    maxTokens,
    timeoutMs,
    fallbackModel
  });

  return extractJsonFromText(content);
}

function isLegacyGeminiModelVersion(modelVersion) {
  if (!modelVersion) {
    return true;
  }

  const normalized = String(modelVersion).toLowerCase();
  return normalized.includes('gemini') || normalized.includes('google');
}

module.exports = {
  LLAMA_MODELS,
  MODEL_VERSIONS,
  hasGroqApiKey,
  createChatCompletion,
  extractJsonFromText,
  requestStructuredJson,
  isLegacyGeminiModelVersion
};
