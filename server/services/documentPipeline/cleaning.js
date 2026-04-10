/**
 * Stage: Text Cleaning
 * Fixes OCR-specific artifacts, noisy whitespace, and common scanning errors.
 */

function cleanOCRText(rawText) {
  if (!rawText) return '';
  let cleaned = rawText;

  // 1. Fix common numeric OCR substitutions contextually
  // l0.2 -> 10.2 (leading 'l' before digit)
  cleaned = cleaned.replace(/\bl(\d+\.?\d*)\b/gi, '1$1'); 
  // O vs 0 in numbers (e.g. 1O.2 -> 10.2)
  cleaned = cleaned.replace(/(\d)O(\.|\d)/g, '$10$2'); 
  cleaned = cleaned.replace(/O(\.\d+)/g, '0$1'); 

  // 2. Fix specific medical unit OCR errors
  cleaned = cleaned.replace(/\bmq\b/gi, 'mg');
  cleaned = cleaned.replace(/g\/d1/gi, 'g/dL');
  cleaned = cleaned.replace(/\/uL/gi, '/µL');

  // 3. Fix common OCR character swaps in known abbreviations
  const correctionMap = {
    'W8C': 'WBC',
    'R8C': 'RBC',
    '8P': 'BP',
    'Plt': 'Platelets',
    'Paracetmol': 'Paracetamol'
  };

  Object.entries(correctionMap).forEach(([bad, good]) => {
     let regex = new RegExp(`\\b${bad}\\b`, 'gi');
     cleaned = cleaned.replace(regex, good);
  });

  // 4. Clean formatting noise
  // Remove excessive spaces and normalize newlines
  cleaned = cleaned.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n');

  return cleaned.trim();
}

module.exports = { cleanOCRText };
