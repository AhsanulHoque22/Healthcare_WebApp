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

  try {
    // 🛠️ Using the discovery-enabled model identifier
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    console.error("Extraction Service Error:", error);
    throw error;
  }
};

module.exports = { extractMedicalData };
