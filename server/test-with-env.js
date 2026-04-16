// Load env FIRST before importing anything
require('dotenv').config({ path: __dirname + '/.env' });

console.log('After dotenv.config():');
console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
console.log('GROQ_API_KEY value:', process.env.GROQ_API_KEY?.substring(0, 10) + '...');

const { hasGroqApiKey } = require('./services/groqLlamaService');
console.log('hasGroqApiKey():', hasGroqApiKey());

// Now test extraction
const { extractDataFromDocument } = require('./services/extractionService');

const testUrl = 'https://res.cloudinary.com/dfnaaukdq/image/upload/v1774812737/prescription_lab_results/jl2wgikzejdu0o121ngy.jpg';

console.log('\n=== Testing Document Extraction with Groq ===');
console.log(`URL: ${testUrl}\n`);

(async () => {
  try {
    console.log('Starting extraction...\n');
    const result = await extractDataFromDocument(testUrl);
    console.log('\n✅ Result:', JSON.stringify(result, null, 2));
    console.log('\nExtraction method:', result.extractionMethod);
    console.log('Model version:', result.modelVersion);
  } catch (error) {
    console.error('\n❌ EXTRACTION FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack.split('\n').slice(0, 5).join('\n'));
  }
  process.exit(0);
})();
