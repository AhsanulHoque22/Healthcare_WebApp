const { callWithFallbackStandard } = require('./llm/llmDispatcher');

const LLAMA_MODELS = Object.freeze({
  // Primary reasoning engine for the chatbot — needs strong clinical accuracy
  chatbotReasoning: process.env.GROQ_CHATBOT_MODEL || 'llama-3.3-70b-versatile',
  // Fast/cheap tasks: routing, extraction, summarization, intent classification
  chatbotFast: 'llama-3.1-8b-instant',
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

// Returns true if any LLM provider is configured — used as a guard in clinical services
function hasGroqApiKey() {
  return Boolean(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY);
}

async function createChatCompletion({
  messages,
  temperature = 0.1,
  maxTokens = 1200,
  timeoutMs = 15000,
}) {
  if (!hasGroqApiKey()) throw new Error('No LLM provider configured.');
  const result = await callWithFallbackStandard(messages, [], { temperature, maxTokens, timeoutMs });
  return result.content?.trim() || '';
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
