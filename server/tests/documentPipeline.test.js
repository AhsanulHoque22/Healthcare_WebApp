const { cleanOCRText } = require('../services/documentPipeline/cleaning');
const { parseMedicalText } = require('../services/documentPipeline/parsing');
const { normalizeAndValidate } = require('../services/documentPipeline/validation');

describe('Medical Document Pipeline: Parsing and Validation Engine', () => {

   test('1. Core OCR Noise Reduction', () => {
       const noisyInput = `
       Patient Name: John Doe
       Hb: l0.2 g/d1 (Low)
       W8C: 12O00 /uL
       Paracetmol 50 mg 1-0-1
       `;
       const cleaned = cleanOCRText(noisyInput);
       expect(cleaned).toContain('Hb: 10.2 g/dL');
       expect(cleaned).toContain('WBC: 12000 /µL');
       expect(cleaned).toContain('Paracetamol 50 mg');
   });

   test('2. Strict Medical Regex & Unit Inference Extraction', async () => {
       const text = `Hb: 10.2 g/dL (Low)\nWBC   11500  /uL`;
       const parsed = await parseMedicalText(text);

       expect(parsed.labResults.length).toBe(2);
       expect(parsed.labResults[0].test).toBe('Hemoglobin');
       expect(parsed.labResults[0].value).toBe(10.2);
       expect(parsed.labResults[0].source).toBeTruthy(); // Traceability verify
       expect(parsed.labResults[1].test).toBe('WBC');
   });

   test('3. Advanced Validation & Clinical Bounds', () => {
       const parsedMock = {
         diagnoses: [],
         medications: [],
         confidence_score: 0.95,
         labResults: [
           { test: 'Hemoglobin', value: 25.0, unit: 'g/dL', status: 'unknown' }, // Biologically impossible
           { test: 'Platelets', value: 200000, unit: '/µL', status: 'unknown' }, // Normal
           { test: 'Hemoglobin', value: 9.0, unit: 'g/dL', status: 'unknown' }   // Second entry (duplicate conflict)
         ]
       };

       const validated = normalizeAndValidate(parsedMock);
       // Should filter duplicates preferring latest valid
       expect(validated.labResults.length).toBe(2);

       const hgb = validated.labResults.find(l => l.test === 'Hemoglobin');
       expect(hgb.value).toBe(9.0); // Resolved duplicate safely by chronological flip preference
       expect(hgb.status).toBe('LOW'); // Dynamically marked
   });

   test('4. Unit Conversion Intelligence', async () => {
       // Inference matching Glucose converting mmol/L to mg/dL
       const cleaned = cleanOCRText("GLUCOSE: 5.5 mmol/L");
       const parsed = await parseMedicalText(cleaned);

       const gl = parsed.labResults.find(l => l.test === 'Glucose');
       expect(gl.value).toBe(99);   // 5.5 * 18 = 99
       expect(gl.unit).toBe('mg/dL');
   });

   test('5. Traceability Preservation', async () => {
       const originalSource = "Impression: Acute Bronchitis";
       const parsed = await parseMedicalText(originalSource);
       expect(parsed.diagnoses[0].condition).toBe("Acute Bronchitis");
       expect(parsed.diagnoses[0].source).toContain(originalSource);
   });
});
