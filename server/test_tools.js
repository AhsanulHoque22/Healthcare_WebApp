require('dotenv').config();
const { callWithFallback } = require('./services/llm/llmDispatcher');
const { TOOL_DEFINITIONS } = require('./services/chatbotTools');

async function testToolCall() {
  const messages = [{ role: 'user', content: 'find me a doctor for my symptopms' }];
  const tools = TOOL_DEFINITIONS.filter(t => t.function.name === 'search_doctors');
  
  console.log('--- Testing Doctor Search Tool Call ---');
  try {
    const res = await callWithFallback(messages, tools, {
      onToken: (t) => process.stdout.write(t),
      onToolStart: (n) => console.log('\nModel wants to call:', n)
    });
    console.log('\nSuccess via', res.provider);
    console.log('Tool Calls:', JSON.stringify(res.toolCalls, null, 2));
  } catch (err) {
    console.error('\nFailed:', err.message);
  }
  process.exit();
}

testToolCall();
