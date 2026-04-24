require('dotenv').config();
const { callWithFallback, callWithFallbackStandard } = require('./services/llm/llmDispatcher');

async function testLLM() {
  const messages = [{ role: 'user', content: 'Say hello' }];
  
  console.log('--- Testing Standard ---');
  try {
    const res = await callWithFallbackStandard(messages, []);
    console.log('Standard Success:', res.content, 'via', res.provider);
  } catch (err) {
    console.error('Standard Failed:', err.message);
  }

  console.log('\n--- Testing Streaming ---');
  try {
    const res = await callWithFallback(messages, [], {
      onToken: (t) => process.stdout.write(t),
      onToolStart: (n) => console.log('\nTool start:', n)
    });
    console.log('\nStreaming Success via', res.provider);
    console.log('Full Content:', res.content);
  } catch (err) {
    console.error('\nStreaming Failed:', err.message);
  }
  process.exit();
}

testLLM();
