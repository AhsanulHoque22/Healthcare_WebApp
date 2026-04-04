const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

const extractMedicalData = async (transcript, language = 'en') => {
  try {
    // 🛠️ Using the most stable model identifier
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an expert clinical scribe. Extract medical data from this transcript and format as JSON.
      Fields needed:
      - medicines: { name, dosage, unit, morning, lunch, dinner, mealTiming, duration, notes }
      - symptoms: { description }
      - diagnosis: { description }
      - vitalSigns: { bloodPressure, heartRate, temperature }
      - instructions: string (advice for patient)
      
      Transcript: "${transcript}"
      
      Output MUST be valid JSON only.
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
