const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

const extractMedicalData = async (transcript, language = 'en') => {
  try {
    // 🛠️ Switching to 'gemini-pro' for maximum compatibility
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      As a medical data architect, transform this clinical transcript into a structured JSON prescription.
      
      TARGET FIELDS:
      1. medicines: Array of { 
         name: string, 
         dosage: string (e.g. "500"), 
         unit: string (e.g. "mg"), 
         frequency: string (e.g. "1-1-1" or "Daily"),
         duration: number (days),
         mealTiming: "before" | "after",
         notes: string 
      }
      2. symptoms: Array of { description: string } (e.g. "Fever", "Dry Cough")
      3. diagnosis: Array of { description: string }
      4. vitalSigns: Object { bloodPressure: string, heartRate: string, temperature: string }
      5. advice: string (Instructions for patient)
      
      TRANSCRIPT (MAY HAVE SOME TYPOS):
      "${transcript}"
      
      STRICT RULES:
      - Reply with ONLY valid JSON. 
      - Correct common transcription misspellings (e.g., "Azithro" -> "Azithromycin").
      - Interpret dosage frequencies clearly (e.g., "Three times a day" -> "1-1-1").
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
