// Load env FIRST before importing anything
require('dotenv').config({ path: __dirname + '/.env' });

const { extractTextFromURL } = require('./services/documentPipeline/extraction');
const { cleanOCRText } = require('./services/documentPipeline/cleaning');
const { requestStructuredJson } = require('./services/groqLlamaService');
const { LLAMA_MODELS } = require('./services/groqLlamaService');

const testUrl = 'https://res.cloudinary.com/dfnaaukdq/image/upload/v1774812737/prescription_lab_results/jl2wgikzejdu0o121ngy.jpg';

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

(async () => {
  try {
    console.log('=== Debugging OCR Extraction ===\n');
    
    console.log('Step 1: Extract OCR text from image...');
    const rawText = await extractTextFromURL(testUrl);
    console.log(`Raw OCR text (${rawText.length} chars):`);
    console.log(rawText.substring(0, 300) + '...\n');
    
    console.log('Step 2: Clean OCR text...');
    const cleanedText = cleanOCRText(rawText);
    console.log(`Cleaned text (${cleanedText.length} chars):`);
    console.log(cleanedText.substring(0, 300) + '...\n');
    
    console.log('Step 3: Send to Groq for analysis...');
    const prompt = `${DOCUMENT_EXTRACTION_SCHEMA_PROMPT}

Source text:
"""${cleanedText}"""`;
    
    console.log(`Prompt length: ${prompt.length} chars`);
    console.log(`Prompt preview:\n${prompt.substring(0, 400)}...\n`);
    
    const result = await requestStructuredJson({
      model: LLAMA_MODELS.documentExtraction,
      systemPrompt: DOCUMENT_EXTRACTION_SYSTEM_PROMPT,
      userPrompt: prompt,
      temperature: 0.1,
      maxTokens: 2000,
      timeoutMs: 25000
    });
    
    console.log('Step 4: Groq Response:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
  }
  process.exit(0);
})();
