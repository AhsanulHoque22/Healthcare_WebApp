/**
 * Stage: Medical Knowledge Base & Normalization
 * Contains comprehensive dictionaries for test standards, units, conversion logic, and ranges.
 */

const MED_KNOWLEDGE = {
  'Hemoglobin': { synonyms: ['HB', 'HGB'], stdUnit: 'g/dL', min: 12.0, max: 16.0, critMin: 5.0, critMax: 20.0 },
  'WBC': { synonyms: ['WBC', 'W8C', 'WHITE BLOOD CELLS', 'LEUKOCYTES', 'WDC'], stdUnit: '/µL', min: 4000, max: 11000, critMin: 1500, critMax: 50000 },
  'RBC': { synonyms: ['RBC', 'RED BLOOD CELLS', 'ERYTHROCYTES'], stdUnit: 'mil/µL', min: 4.0, max: 6.0, critMin: 2.0, critMax: 8.0 },
  'Platelets': { synonyms: ['PLT', 'PLATELETS', 'THROMBOCYTES'], stdUnit: '/µL', min: 150000, max: 450000, critMin: 20000, critMax: 1000000 },
  'Glucose': { synonyms: ['GLUCOSE', 'FST', 'RBS', 'FBS'], stdUnit: 'mg/dL', min: 70, max: 100, critMin: 40, critMax: 400 },
  'Creatinine': { synonyms: ['CREATININE', 'CREAT', 'CR'], stdUnit: 'mg/dL', min: 0.6, max: 1.2, critMin: 0.2, critMax: 5.0 },
  'Urea': { synonyms: ['UREA', 'BUN'], stdUnit: 'mg/dL', min: 7, max: 20, critMin: 2, critMax: 100 },
  'Cholesterol': { synonyms: ['CHOLESTEROL', 'CHOL'], stdUnit: 'mg/dL', min: 120, max: 200, critMin: 50, critMax: 500 },
  'Triglycerides': { synonyms: ['TRIGLYCERIDES', 'TGS', 'TRIG'], stdUnit: 'mg/dL', min: 50, max: 150, critMin: 10, critMax: 1000 },
  'Sodium': { synonyms: ['SODIUM', 'NA'], stdUnit: 'mmol/L', min: 135, max: 145, critMin: 115, critMax: 160 },
  'Potassium': { synonyms: ['POTASSIUM', 'K'], stdUnit: 'mmol/L', min: 3.5, max: 5.0, critMin: 2.5, critMax: 7.0 },
  'TSH': { synonyms: ['TSH'], stdUnit: 'µIU/mL', min: 0.4, max: 4.0, critMin: 0.01, critMax: 50.0 }
};

const UNIT_MAP = {
  'g/dl': 'g/dL',
  'g/d1': 'g/dL',
  'mg/dl': 'mg/dL',
  'mmol/l': 'mmol/L',
  '/ul': '/µL',
  '/µl': '/µL',
  'cells/mcl': '/µL',
  '10^3/ul': 'k/µL',
  'iu/l': 'IU/L',
  'meq/l': 'mEq/L',
  '/cmm': '/µL',
  'million/cmm': 'mil/µL'
};

const FREQUENCY_DICTIONARY = {
  '1-0-1': 'Twice daily',
  '1-0-0': 'Once daily morning',
  '0-0-1': 'Once daily night',
  '1-1-1': 'Three times daily',
  'BD': 'Twice daily',
  'TDS': 'Three times daily',
  'OD': 'Once daily'
};

function normalizeTestName(rawTerm) {
  if (!rawTerm) return null;
  const upper = rawTerm.toUpperCase().trim();
  for (const [key, data] of Object.entries(MED_KNOWLEDGE)) {
     if (key.toUpperCase() === upper || data.synonyms.includes(upper)) {
         return key;
     }
  }
  return rawTerm.trim();
}

function normalizeUnits(unit) {
  if (!unit) return null;
  const lower = unit.trim().toLowerCase();
  return UNIT_MAP[lower] || unit.trim();
}

/**
 * Unit Conversion & Inference Engine
 */
function standardizeUnitAndValue(testName, value, unit) {
  const normTest = normalizeTestName(testName);
  const data = MED_KNOWLEDGE[normTest];
  let finalValue = value;
  let finalUnit = normalizeUnits(unit);

  if (data) {
     // Infer missing unit if plausible
     if (!finalUnit) finalUnit = data.stdUnit;

     // Convert Glucose: mmol/L -> mg/dL
     if (normTest === 'Glucose' && finalUnit === 'mmol/L') {
         finalValue = parseFloat((value * 18).toFixed(2));
         finalUnit = 'mg/dL';
     }
  }
  return { testName: normTest, value: finalValue, unit: finalUnit };
}

function normalizeFrequency(freqRaw) {
    if(!freqRaw) return 'As directed';
    const clean = freqRaw.trim().toUpperCase();
    return FREQUENCY_DICTIONARY[clean] || freqRaw.trim();
}

module.exports = { MED_KNOWLEDGE, normalizeTestName, normalizeUnits, standardizeUnitAndValue, normalizeFrequency };
