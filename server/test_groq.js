require('dotenv').config();
const axios = require('axios');
const CHATBOT_MODEL = "llama-3.3-70b-versatile";

async function testGroq() {
  const SYS_PROMPT = "You are a helpful assistant.";
  const messages = [
    { role: "system", content: SYS_PROMPT },
    { role: "user", content: "What's my next appointment?" }
  ];

  try {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: CHATBOT_MODEL,
      messages,
      // intentionally omitting tools to keep it simple, or we can include them
      temperature: 0.0
    }, {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      timeout: 25000
    });
    console.log("Success:", res.data.choices[0].message.content);
  } catch (err) {
    const status = err.response?.status;
    const body = err.response?.data;
    console.error("Error status:", status);
    console.error("Error body:", JSON.stringify(body, null, 2));
    console.error("Error msg:", err.message);
  }
  process.exit(0);
}
testGroq();
