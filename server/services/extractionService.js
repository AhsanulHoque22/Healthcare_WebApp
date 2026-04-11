const { cleanOCRText } = require('./documentPipeline/cleaning');
const { extractTextFromURL } = require('./documentPipeline/extraction');
const { normalizeAndValidate } = require('./documentPipeline/validation');
const { parseMedicalText } = require('./documentPipeline/parsing');
const {
  LLAMA_MODELS,
  MODEL_VERSIONS,
  hasGroqApiKey,
  createChatCompletion,
  requestStructuredJson
} = require('./groqLlamaService');

const DOCUMENT_EXTRACTION_SYSTEM_PROMPT = `You are Livora's clinical document extraction engine.
Extract only facts explicitly present in the source material.
Return JSON only. Never wrap output in markdown.
Use empty arrays, empty strings, or null when a field is absent.
Do not infer diagnoses, medications, or interpretations that are not directly supported by the document.`;

const DOCUMENT_EXTRACTION_SCHEMA_PROMPT = `Return a JSON object with this exact top-level shape:
{
  "documentType": "lab_report|prescription|medical_record|scan|other",
  "patientName": "string",
  "date": "YYYY-MM-DD|null",
  "diagnoses": [{"condition": "string", "status": "active|resolved|history|suspected|unknown", "notes": "string"}],
  "labResults": [{"test": "string", "value": "string", "unit": "string", "referenceRange": "string", "status": "normal|low|high|abnormal|critical|pending|unknown"}],
  "medications": [{"name": "string", "dosage": "string", "instructions": "string", "frequency": "string", "duration": "string", "status": "active|completed|held|unknown"}],
  "doctorNotes": "string"
}`;

const PRESCRIPTION_SYSTEM_PROMPT = `You are a specialized medical scribe.
Convert the doctor's dictation into valid JSON only.
Do not output markdown. Do not add commentary.`;

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().split('T')[0];
}

function normalizeDocumentType(type) {
  const allowedTypes = new Set(['lab_report', 'prescription', 'medical_record', 'scan', 'other']);
  return allowedTypes.has(type) ? type : 'other';
}

function normalizeStatus(status, fallback = 'unknown') {
  if (!status) {
    return fallback;
  }

  const normalized = String(status).toLowerCase();
  return normalized;
}

function normalizeExtractedDocument(data, metadata = {}) {
  const normalized = {
    documentType: normalizeDocumentType(data?.documentType),
    patientName: typeof data?.patientName === 'string' ? data.patientName.trim() : '',
    date: normalizeDate(data?.date),
    diagnoses: normalizeArray(data?.diagnoses).map((diagnosis) => ({
      condition: diagnosis?.condition || diagnosis?.diagnosis || '',
      status: normalizeStatus(diagnosis?.status),
      notes: diagnosis?.notes || ''
    })).filter((diagnosis) => diagnosis.condition),
    labResults: normalizeArray(data?.labResults).map((labResult) => ({
      test: labResult?.test || '',
      value: labResult?.value == null ? '' : String(labResult.value).trim(),
      unit: labResult?.unit || '',
      referenceRange: labResult?.referenceRange || '',
      status: normalizeStatus(labResult?.status)
    })).filter((labResult) => labResult.test),
    medications: normalizeArray(data?.medications).map((medication) => ({
      name: medication?.name || '',
      dosage: medication?.dosage || '',
      instructions: medication?.instructions || '',
      frequency: medication?.frequency || '',
      duration: medication?.duration || '',
      status: normalizeStatus(medication?.status)
    })).filter((medication) => medication.name),
    doctorNotes: typeof data?.doctorNotes === 'string' ? data.doctorNotes.trim() : '',
    extractionMethod: metadata.extractionMethod || 'ocr_text_llama',
    modelVersion: metadata.modelVersion || MODEL_VERSIONS.documentExtraction,
    analyzedAt: metadata.analyzedAt || new Date().toISOString()
  };

  const validatedLabs = normalizeAndValidate({
    labResults: normalized.labResults.map((labResult) => ({
      ...labResult,
      value: Number.parseFloat(labResult.value)
    })),
    diagnoses: normalized.diagnoses,
    medications: normalized.medications,
    confidence_score: 0.9
  }).labResults;

  normalized.labResults = normalized.labResults.map((labResult) => {
    const validated = validatedLabs.find((item) => item.test === labResult.test);
    if (!validated) {
      return labResult;
    }

    if (Number.isNaN(Number.parseFloat(labResult.value))) {
      return labResult;
    }

    const computedStatus = String(validated.status || labResult.status || 'unknown').toLowerCase();
    return {
      ...labResult,
      status: computedStatus === 'normal' ? 'normal' : computedStatus
    };
  });

  return normalized;
}

async function extractStructuredDataFromText(rawText) {
  if (!hasGroqApiKey()) {
    const fallback = await parseMedicalText(rawText);
    return normalizeExtractedDocument({
      documentType: 'other',
      patientName: '',
      date: null,
      diagnoses: fallback.diagnoses,
      labResults: fallback.labResults,
      medications: fallback.medications,
      doctorNotes: ''
    }, {
      extractionMethod: 'ocr_text_deterministic',
      modelVersion: 'deterministic-fallback'
    });
  }

  const prompt = `${DOCUMENT_EXTRACTION_SCHEMA_PROMPT}

Source text:
"""${rawText.slice(0, 14000)}"""`;

  const extracted = await requestStructuredJson({
    model: LLAMA_MODELS.documentExtraction,
    systemPrompt: DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
    userPrompt: prompt,
    temperature: 0.1,
    maxTokens: 2000,
    timeoutMs: 25000
  });

  return normalizeExtractedDocument(extracted, {
    extractionMethod: 'ocr_text_llama',
    modelVersion: MODEL_VERSIONS.documentExtraction
  });
}

async function extractStructuredDataFromVision(url) {
  const extracted = await requestStructuredJson({
    model: LLAMA_MODELS.documentVision,
    systemPrompt: DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
    userContent: [
      { type: 'text', text: `${DOCUMENT_EXTRACTION_SCHEMA_PROMPT}\n\nExtract directly from this image medical document.` },
      { type: 'image_url', image_url: { url } }
    ],
    temperature: 0.1,
    maxTokens: 1800,
    timeoutMs: 25000
  });

  return normalizeExtractedDocument(extracted, {
    extractionMethod: 'llama_vision',
    modelVersion: MODEL_VERSIONS.documentVision
  });
}

function isLikelyImageUrl(url) {
  return /\.(png|jpe?g|webp|bmp|gif|tiff?)($|\?)/i.test(url || '');
}

const extractMedicalData = async (transcript, language = 'en') => {
  const prompt = `
MATCH THESE UI FIELDS EXACTLY:
{
  "medicines": [{
    "name": "string",
    "type": "Tablet|Syrup|Injection|Capsule",
    "dosage": "string",
    "morning": 0,
    "lunch": 0,
    "dinner": 0,
    "mealTiming": "Before Meal|After Meal",
    "duration": 0,
    "instructions": "string"
  }],
  "vitalSigns": {
    "bloodPressure": "string",
    "heartRate": 0,
    "temperature": "string",
    "respiratoryRate": 0,
    "oxygenSaturation": 0
  },
  "clinicalFindings": "string",
  "symptoms": [{"description": "string"}],
  "diagnosis": [{"description": "string", "date": "YYYY-MM-DD"}],
  "tests": [{"name": "string", "description": "string"}]
}

Language context: ${language}
Transcript:
"""${transcript}"""

Rules:
- Interpret "three times a day" as morning: 1, lunch: 1, dinner: 1.
- Default mealTiming to "After Meal" if not specified.
- Return JSON only.`;

  return requestStructuredJson({
    model: LLAMA_MODELS.documentExtraction,
    systemPrompt: PRESCRIPTION_SYSTEM_PROMPT,
    userPrompt: prompt,
    temperature: 0.1,
    maxTokens: 1800,
    timeoutMs: 20000
  });
};

const analyzeDocument = async (url, query) => {
  try {
    const extracted = await extractDataFromDocument(url);
    const question = query || 'What is this document about and what are its key findings?';

    if (!hasGroqApiKey()) {
      return `Structured findings: ${JSON.stringify(extracted)}`;
    }

    return createChatCompletion({
      model: LLAMA_MODELS.documentExtraction,
      messages: [
        {
          role: 'system',
          content: 'You are a medical analyst. Answer using only the provided extracted findings. If information is unavailable, say so plainly.'
        },
        {
          role: 'user',
          content: `Question: ${question}\n\nExtracted findings:\n${JSON.stringify(extracted)}`
        }
      ],
      temperature: 0.1,
      maxTokens: 500,
      timeoutMs: 15000
    });
  } catch (error) {
    console.error('Document Analysis Error:', error);
    throw new Error('Unable to analyze document at the moment.');
  }
};

const extractDataFromDocument = async (url) => {
  try {
    if (isLikelyImageUrl(url) && hasGroqApiKey()) {
      try {
        return await extractStructuredDataFromVision(url);
      } catch (visionError) {
        console.warn('[Extraction Service] Vision extraction failed, falling back to OCR:', visionError.message);
      }
    }

    const rawText = cleanOCRText(await extractTextFromURL(url));
    if (!rawText) {
      throw new Error('No readable text extracted from document.');
    }

    return await extractStructuredDataFromText(rawText);
  } catch (error) {
    console.error('Document Data Extraction Error:', error);
    throw new Error('Unable to extract data from document.');
  }
};

module.exports = { extractMedicalData, analyzeDocument, extractDataFromDocument };
