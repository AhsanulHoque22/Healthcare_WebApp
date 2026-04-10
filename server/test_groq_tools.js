require('dotenv').config();
const axios = require('axios');
const { TOOL_DEFINITIONS } = require('./services/chatbotTools');

const CHATBOT_MODEL = "llama-3.3-70b-versatile";

async function testGroqWithTools() {
  const SYS_PROMPT = "You are a helpful assistant.";
  const messages = [
    { role: "system", content: SYS_PROMPT },
    { role: "user", content: "What's my next appointment?" }
  ];

  try {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: CHATBOT_MODEL,
      messages,
      tools: TOOL_DEFINITIONS,
      tool_choice: "auto",
      temperature: 0.0
    }, {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      timeout: 25000
    });
    console.log("Success! Finish reason:", res.data.choices[0].finish_reason);
  } catch (err) {
    const status = err.response?.status;
    const body = err.response?.data;
    console.error("Error status:", status);
    console.error("Error body:", JSON.stringify(body, null, 2));
    console.error("Error msg:", err.message);
  }
  process.exit(0);
}
testGroqWithTools();
