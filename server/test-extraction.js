const { extractDataFromDocument } = require('./services/extractionService');

// Test URL from the error
const testUrl = 'https://res.cloudinary.com/dfnaaukdq/image/upload/v1774812737/prescription_lab_results/jl2wgikzejdu0o121ngy.jpg';

console.log('\n=== Testing Document Extraction ===');
console.log(`URL: ${testUrl}\n`);

(async () => {
  try {
    console.log('Starting extraction...\n');
    const result = await extractDataFromDocument(testUrl);
    console.log('\n✅ SUCCESS!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('\n❌ EXTRACTION FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
  process.exit(0);
})();
