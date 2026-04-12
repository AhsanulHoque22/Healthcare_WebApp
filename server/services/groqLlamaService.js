const axios = require('axios');

const GROQ_CHAT_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';

const LLAMA_MODELS = Object.freeze({
  documentExtraction: process.env.GROQ_DEEP_MEDICAL_MODEL || 'llama-3.3-70b-versatile',
  patientInsight: process.env.GROQ_FAST_INSIGHT_MODEL || 'llama-3.3-70b-versatile',
  documentVision: process.env.GROQ_VISION_MODEL || 'llama-3.2-90b-vision-preview'
});

const MODEL_VERSIONS = Object.freeze({
  documentExtraction: `groq/${LLAMA_MODELS.documentExtraction}:livora-medical-v1`,
  patientInsight: `groq/${LLAMA_MODELS.patientInsight}:livora-summary-v1`,
  documentVision: `groq/${LLAMA_MODELS.documentVision}:livora-vision-v1`
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
  timeoutMs = 15000
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
  timeoutMs = 20000
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
    timeoutMs
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
