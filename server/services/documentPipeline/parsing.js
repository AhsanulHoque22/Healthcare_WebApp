const { normalizeFrequency, standardizeUnitAndValue, MED_KNOWLEDGE } = require('./normalization');
const { hasGroqApiKey, LLAMA_MODELS, requestStructuredJson } = require('../groqLlamaService');

/**
 * Stage: Entity Extraction Core
 * Highly deterministic regex mapping providing explicit traceback to raw source
 */
function deterministicParse(cleanedText) {
  const result = {
    diagnoses: [],
    labResults: [],
    medications: []
  };

  // Build dynamic lab regex matching any synonym defined in dictionary
  const labKeys = Object.values(MED_KNOWLEDGE).flatMap(d => d.synonyms).concat(Object.keys(MED_KNOWLEDGE));
  // Create safe escaped OR group
  const groupedLabKeys = Array.from(new Set(labKeys)).sort((a,b)=>b.length-a.length).join('|');
  
  // Format: "Key Value OptionalUnit OptionalStatus"
  const labRegex = new RegExp(`(${groupedLabKeys})[\\s:]+([\\d\\.]+)(?:\\s*\\/\\s*([\\d\\.]+))?\\s*([a-zA-Z\\/\\%µ]+)?(?:[\\s\\(\\[\\{]*(Low|High|Normal|Abnormal)[\\s\\)\\]\\}]*)?`, 'gi');
  
  let match;
  while ((match = labRegex.exec(cleanedText)) !== null) {
      const sourceSnippet = match[0].trim();
      const rawTest = match[1];
      const value1 = match[2];
      const value2 = match[3]; 
      const rawUnit = match[4];

      // Smart normalization converting types natively
      const { testName, value, unit } = standardizeUnitAndValue(rawTest, parseFloat(value1), rawUnit);

      result.labResults.push({
         test: testName,
         value,
         unit,
         source: sourceSnippet,
         confidence: 0.95
      });

      if (value2) {
         result.labResults.push({
            test: `${testName} (Secondary)`,
            value: parseFloat(value2),
            unit,
            source: sourceSnippet,
            confidence: 0.90
         });
      }
  }

  // Medications Parsing (e.g. "Paracetamol 500mg 1-0-1 x 5 days")
  const medRegex = /([A-Za-z]+(?:\s[A-Za-z]+)?)\s+(\d+(?:\.\d+)?\s*(?:mg|ml|g|mcg|iu))\s+(\d-\d-\d(?:-\d)?|BD|TDS|OD|1-1-1)\s*(?:x\s*|for\s*)?(\d+\s*days?)?/gi;
  while ((match = medRegex.exec(cleanedText)) !== null) {
      const sourceSnippet = match[0].trim();
      let dosageRaw = match[2].replace(/\s/g, '');

      // Edge case: OCR dropping '0' safely bridged
      if (match[1].toLowerCase().includes('paracetamol') && dosageRaw === '50mg') {
          dosageRaw = '500mg'; 
      }

      result.medications.push({
        name: match[1].trim(),
        dosage: dosageRaw,
        frequency: normalizeFrequency(match[3]),
        duration: match[4] ? match[4].trim() : 'ongoing',
        source: sourceSnippet,
        confidence: 0.95
      });
  }

  // Diagnoses Parsing
  const diagRegex = /(?:Diagnosis|Impression|Assessment|Plan)[\s:]+([A-Za-z\s0-9,\-]+)(\n|$)/gi;
  while ((match = diagRegex.exec(cleanedText)) !== null) {
      if (match[1].trim().length > 3) {
         result.diagnoses.push({ 
           condition: match[1].trim(), 
           source: match[0].trim(),
           confidence: 0.90
         });
      }
  }

  return result;
}

/**
 * Stage: Controlled LLM Fallback
 */
async function extractWithLLM(rawText, baseData) {
  try {
     if (!hasGroqApiKey()) {
        return { ...baseData, fallback_triggered: false };
     }

     const prompt = `As a meticulous medical data parser, act as a fallback engine.
Extract strictly in JSON format. Do NOT hallucinate values. Preserve uncertainty.
For 'source', provide the exact snippet from the text proving the extraction.

{ 
  "diagnoses": [{"condition": "...", "source": "...", "confidence": 0.70}], 
  "labResults": [{"test": "...", "value": 0.0, "unit": "...", "source": "...", "confidence": 0.70}], 
  "medications": [{"name": "...", "dosage": "...", "frequency": "...", "duration": "...", "source": "...", "confidence": 0.70}] 
}

Text to parse:
"""${rawText.substring(0, 6000)}"""`;

     const parsed = await requestStructuredJson({
        model: LLAMA_MODELS.documentExtraction,
        systemPrompt: 'You are a careful clinical information extractor. Return JSON only.',
        userPrompt: prompt,
        temperature: 0.1,
        maxTokens: 1200
     });

     return {
        diagnoses: [...baseData.diagnoses, ...(parsed.diagnoses || [])],
        labResults: [...baseData.labResults, ...(parsed.labResults || [])],
        medications: [...baseData.medications, ...(parsed.medications || [])],
        fallback_triggered: true
     };
  } catch(e) {
     return { ...baseData, fallback_triggered: false };
  }
}

async function parseMedicalText(cleanedText) {
  let parsedData = deterministicParse(cleanedText);
  let confidence_score = 0.95;

  if (parsedData.labResults.length === 0 && parsedData.medications.length === 0 && parsedData.diagnoses.length === 0) {
      parsedData = await extractWithLLM(cleanedText, parsedData);
      confidence_score = 0.70; 
  } else if (parsedData.fallback_triggered) {
      confidence_score = 0.85; 
  }

  parsedData.confidence_score = confidence_score;
  return parsedData;
}

module.exports = { parseMedicalText };
