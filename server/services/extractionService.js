const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

const extractMedicalData = async (transcript, language = 'en') => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Extract structured medical information from the following doctor-patient conversation transcript.
      The transcript might be in English, Bengali, or a mix of both.
      Format the output as a valid JSON object with the following fields:
      - medicines: array of objects { name, dosage, unit ('mg' | 'ml'), type ('tablet' | 'syrup'), morning (number), lunch (number), dinner (number), mealTiming ('before' | 'after'), duration (number in days), notes }
      - symptoms: array of objects { description }
      - diagnosis: array of objects { description, date (YYYY-MM-DD) }
      - vitalSigns: object { bloodPressure, heartRate, temperature, respiratoryRate, oxygenSaturation }
      - clinicalFindings: string (summary of clinical examination findings)
      - recommendations: object { exercises, dietaryChanges, suggestions }
      - tests: array of objects { name, description }

      Rules:
      1. If a detail is missing, set it to null or empty array/object appropriately.
      2. For medicines, if "one tablet three times a day" is mentioned, set morning: 1, lunch: 1, dinner: 1.
      3. Convert Bengali medical terms to English where possible (e.g., "জ্বর" -> "Fever").
      4. Ensure the output is strictly JSON.

      Transcript:
      "${transcript}"
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
