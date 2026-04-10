const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

const extractMedicalData = async (transcript, language = 'en') => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  // � ONE-TIME DISCOVERY ON RAILWAY
  try {
    const discoUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const discoRes = await fetch(discoUrl);
    const discoData = await discoRes.json();
    if (discoData.models) {
      console.log("[RAILWAY DISCOVERY] Available Models:", discoData.models.map(m => m.name.replace('models/', '')).join(', '));
    }
  } catch (e) {}

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      // 🛠️ Using the stable discovery-verified alias
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

      const prompt = `
        As a specialized medical scribe, convert this doctor's dictation into a structured JSON prescription.
        MATCH THESE UI FIELDS EXACTLY:

        1. medicines: Array of {
           name: string,
           type: "Tablet" | "Syrup" | "Injection" | "Capsule",
           dosage: string (mg calculation),
           morning: number (how many units),
           lunch: number (how many units),
           dinner: number (how many units),
           mealTiming: "Before Meal" | "After Meal",
           duration: number (days),
           instructions: string
        }
        2. vitalSigns: {
           bloodPressure: string (e.g. "120/80"),
           heartRate: number,
           temperature: string (e.g. "98.6"),
           respiratoryRate: number,
           oxygenSaturation: number
        }
        3. clinicalFindings: string (detailed examination summary)
        4. symptoms: Array of { description: string }
        5. diagnosis: Array of { description: string, date: string (YYYY-MM-DD) }
        6. tests: Array of { name: string, description: string }

        TRANSCRIPT:
        "${transcript}"

        RULES:
        - Interpret "Three times a day" as morning:1, lunch:1, dinner:1.
        - Default mealTiming to "After Meal" if not specified.
        - Return ONLY a valid JSON object.
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Extract JSON from response (handling potential markdown blocks)
      let jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Failed to parse extracted JSON:", e);
          throw new Error("Invalid format in extraction result");
        }
      }
      
      throw new Error("No structured data found in extraction result");
    } catch (error) {
      attempt++;
      const isRetryable = error.status === 429 || error.status === 503 || error.message?.includes("High Demand");
      
      if (isRetryable && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[Extraction] Gemini error (${error.status}). Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      console.error("Extraction Service Error:", error);
      throw error;
    }
  }
};

const analyzeDocument = async (url, query) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch document: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get("content-type") || "application/pdf";

    const prompt = `You are a medical analyst. Analyze the provided medical document factually. Do not hallucinate any information.
Answer the user's query clearly based ONLY on the document findings.

Query: ${query || "What is this document about and what are its key findings?"}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType
        }
      }
    ]);
    return result.response.text();
  } catch (error) {
    console.error("Document Analysis Error:", error);
    throw new Error("Unable to analyze document at the moment.");
  }
};

const extractDataFromDocument = async (url) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch document: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = response.headers.get("content-type") || "application/pdf";

    const prompt = `You are an expert medical data extractor. Your task is to extract complete structured medical data from this document.
Extract all diagnoses, test names, test results (values + units), reference ranges, medications, dosage instructions, and doctor notes.

You MUST return ONLY a valid JSON object matching this structure loosely:
{
  "diagnoses": [{"condition": "...", "status": "..."}],
  "labResults": [{"test": "...", "value": "10.2", "unit": "g/dL", "referenceRange": "12.0 - 15.5", "status": "low"}],
  "medications": [{"name": "...", "dosage": "...", "instructions": "..."}],
  "doctorNotes": "...",
  "documentType": "lab_report|prescription|medical_record|scan",
  "patientName": "...",
  "date": "YYYY-MM-DD"
}

If a field is not present in the document, use an empty array, empty string, or null.
DO NOT include markdown tags like \`\`\`json. Return RAW JSON ONLY.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType
        }
      }
    ]);
    const responseText = result.response.text();
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { error: "Failed to parse JSON" };
  } catch (error) {
    console.error("Document Data Extraction Error:", error);
    throw new Error("Unable to extract data from document.");
  }
};

module.exports = { extractMedicalData, analyzeDocument, extractDataFromDocument };
