require('dotenv').config();
const axios = require('axios');
const { TOOL_DEFINITIONS } = require('./services/chatbotTools');

async function testGroq() {
  const SYSTEM_PROMPT = `
You are Livora AI, a friendly and intuitive healthcare assistant.

CRITICAL INSTRUCTIONS:
1. Understanding Intent: Users may use vague, non-medical terms. If a user asks for a "summary", "my info", "my details", or "how am I doing", proactively assume they want their health overview and use the generate_medical_summary and get_patient_profile tools.
2. Proactive Assistance: If a request is unclear or incomplete, DO NOT fall back to a generic greeting. Instead, politely offer options based on what they might need (e.g., "Would you like me to get your medical summary, check your appointments, or find a doctor?") or ask a clarifying question.
3. Capabilities: If asked what you can do, state you can summarize medical data, search doctors, book/manage appointments, check prescriptions/medicines, read lab orders, analyze medical documents, and handle emergencies.
4. Data Usage: ONLY use data retrieved from tool calls to answer data-specific or medical questions.
5. Booking Workflow: Naturally guide the user: search_doctors -> select date/time -> get symptoms -> book.
6. Greetings: ONLY use "Hi, I'm Livora. How can I help?" if the user explicitly greets you (like "hi" or "hello") and asks no other question. 
`;
  
  // Simulated initial conversation
  let messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: 'What are my active medicines now' }
  ];

  try {
    console.log("ROUND 1: Sending user message...");
    let res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: "llama-3.1-8b-instant",
      messages,
      tools: TOOL_DEFINITIONS,
      tool_choice: "auto",
      temperature: 0.0
    }, {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
    });
    
    let choice = res.data.choices[0];
    console.log("ROUND 1 RESPONSE:", JSON.stringify(choice.message, null, 2));

    if (choice.finish_reason === 'tool_calls') {
      messages.push(choice.message);
      
      // Simulate tool result
      console.log("\nSimulating tool execution... returning empty array []");
      
      messages.push({
        role: "tool",
        tool_call_id: choice.message.tool_calls[0].id,
        content: "[]"
      });

      console.log("\nROUND 2: Sending tool results...");
      let res2 = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: "llama-3.1-8b-instant",
        messages,
        tools: TOOL_DEFINITIONS,
        tool_choice: "auto",
        temperature: 0.0
      }, {
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
      });
      console.log("ROUND 2 RESPONSE:", JSON.stringify(res2.data.choices[0].message, null, 2));
    }
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}
testGroq();
