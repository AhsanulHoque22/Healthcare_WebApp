/**
 * medicalRetriever.js
 *
 * RAG retrieval layer for medical knowledge queries.
 * Two-stage retrieval:
 *   1. OpenFDA API — authoritative drug label / interaction data (free, no key)
 *   2. Curated static knowledge base — common conditions, symptoms, prevention
 *
 * The LLM is instructed to answer ONLY from the returned context so it cannot
 * hallucinate facts that aren't in the retrieved chunks.
 */

const axios = require('axios');

const OPENFDA_LABEL_URL = 'https://api.fda.gov/drug/label.json';
const OPENFDA_TIMEOUT_MS = 6000;

// ── Drug-name detection ────────────────────────────────────────────────────────
// Matches generic drug names and common brand names to decide if OpenFDA is relevant
const DRUG_QUERY_PATTERN =
  /\b(aspirin|paracetamol|acetaminophen|ibuprofen|metformin|amoxicillin|omeprazole|atorvastatin|lisinopril|amlodipine|metoprolol|losartan|azithromycin|cetirizine|loratadine|insulin|warfarin|clopidogrel|pantoprazole|sertraline|fluoxetine|salbutamol|prednisone|dexamethasone|ciprofloxacin|drug|medication|medicine|tablet|capsule|dosage|interaction|side effect|contraindication|overdose)\b/i;

// ── Static curated knowledge base ────────────────────────────────────────────
// Each entry: { topics: string[], content: string }
// topics are used for keyword matching; content is the retrieved chunk
const STATIC_KB = [
  {
    topics: ['diabetes', 'type 2 diabetes', 'blood sugar', 'glucose', 'insulin resistance', 'hyperglycemia'],
    content: `Type 2 Diabetes: A chronic condition where the body doesn't use insulin effectively.
Symptoms: increased thirst, frequent urination, fatigue, blurred vision, slow-healing sores, frequent infections.
Risk factors: obesity, physical inactivity, family history, age over 45.
Management: lifestyle changes (diet, exercise), blood sugar monitoring, oral medications (e.g. metformin), insulin therapy in advanced cases.
Prevention: maintaining healthy weight, regular physical activity, balanced diet low in refined sugars.
Source: WHO, CDC Diabetes Guidelines 2023.`,
  },
  {
    topics: ['hypertension', 'high blood pressure', 'blood pressure', 'systolic', 'diastolic', 'mmhg'],
    content: `Hypertension (High Blood Pressure): Blood pressure consistently above 130/80 mmHg.
Symptoms: often asymptomatic ("silent killer"); severe cases may cause headache, nosebleed, shortness of breath.
Risk factors: obesity, high salt diet, physical inactivity, smoking, excessive alcohol, stress, family history.
Management: lifestyle changes (DASH diet, exercise, reduce salt/alcohol), antihypertensive medications (ACE inhibitors, ARBs, beta-blockers, diuretics).
Target: below 130/80 mmHg for most adults.
Source: JNC 8 Guidelines, WHO Hypertension Report 2023.`,
  },
  {
    topics: ['asthma', 'bronchial asthma', 'inhaler', 'wheeze', 'wheezing', 'bronchospasm', 'shortness of breath'],
    content: `Asthma: A chronic inflammatory airway disease causing recurrent episodes of wheezing, breathlessness, chest tightness, and cough.
Triggers: allergens (dust, pollen, pet dander), respiratory infections, exercise, cold air, smoke, stress.
Management: Reliever inhalers (short-acting beta-agonists like salbutamol) for acute symptoms; preventer inhalers (inhaled corticosteroids like beclomethasone) for long-term control.
Emergency signs: inability to speak in full sentences, cyanosis (blue lips), no improvement after rescue inhaler — seek emergency care immediately.
Source: GINA Asthma Guidelines 2023.`,
  },
  {
    topics: ['fever', 'high temperature', 'pyrexia', 'temperature', 'febrile'],
    content: `Fever: Body temperature above 38°C (100.4°F). It is a sign of the immune system responding to infection or illness.
Common causes: viral infections (flu, cold, COVID-19), bacterial infections, inflammatory conditions.
Management: rest, adequate hydration, paracetamol or ibuprofen for comfort. Seek medical attention if fever exceeds 39.5°C, lasts more than 3 days, or is accompanied by severe headache, stiff neck, rash, or breathing difficulty.
Source: NHS, WHO Fever Management Guidelines.`,
  },
  {
    topics: ['flu', 'influenza', 'cold', 'common cold', 'rhinovirus', 'runny nose', 'cough', 'sore throat'],
    content: `Influenza (Flu): A highly contagious respiratory illness caused by influenza viruses.
Symptoms: sudden onset fever, chills, muscle aches, headache, fatigue, dry cough, sore throat, runny nose.
Differs from common cold: flu onset is rapid and more severe; cold is gradual with milder symptoms.
Management: rest, fluids, paracetamol/ibuprofen for fever and aches. Antiviral medications (oseltamivir) effective if started within 48 hours of symptom onset.
Prevention: annual flu vaccine, handwashing, avoiding close contact with infected individuals.
Source: CDC Influenza Guidelines 2023-2024.`,
  },
  {
    topics: ['covid', 'covid-19', 'coronavirus', 'sars-cov-2', 'omicron'],
    content: `COVID-19: Respiratory illness caused by the SARS-CoV-2 virus.
Common symptoms: fever, dry cough, fatigue, loss of taste/smell, sore throat, headache, body aches.
Severe symptoms (seek emergency care): difficulty breathing, persistent chest pain, confusion, inability to stay awake, bluish lips or face.
Management: rest, fluids, paracetamol for fever. Antiviral treatments (nirmatrelvir/ritonavir, remdesivir) available for high-risk individuals.
Prevention: vaccination, masking in high-risk settings, ventilation, handwashing.
Source: WHO COVID-19 Clinical Management Guidelines 2023.`,
  },
  {
    topics: ['cholesterol', 'ldl', 'hdl', 'triglycerides', 'dyslipidemia', 'lipids', 'statin'],
    content: `Cholesterol Management: Cholesterol is a waxy substance in the blood needed for cell function, but excess leads to cardiovascular disease.
Normal values: Total cholesterol < 5.0 mmol/L; LDL ("bad") < 3.0 mmol/L; HDL ("good") > 1.0 mmol/L (men), > 1.2 mmol/L (women).
Risk factors for high cholesterol: unhealthy diet, obesity, lack of exercise, smoking, diabetes, family history.
Management: dietary changes (reduce saturated fat, increase fiber), exercise, statins (atorvastatin, rosuvastatin) for high-risk patients.
Source: ESC/EAS Dyslipidemia Guidelines 2019, NHS Cholesterol Guidelines.`,
  },
  {
    topics: ['heart attack', 'myocardial infarction', 'chest pain', 'angina', 'cardiac', 'coronary'],
    content: `Heart Attack (Myocardial Infarction): Occurs when blood flow to a part of the heart is blocked, causing muscle damage.
Warning signs: chest pain or pressure (may radiate to arm, jaw, back), shortness of breath, cold sweat, nausea, lightheadedness.
IMPORTANT: If heart attack is suspected, call emergency services (999) immediately. Do not drive yourself to hospital. Chew an aspirin (300mg) if not allergic and no contraindication.
Risk factors: hypertension, high cholesterol, diabetes, smoking, obesity, family history.
Source: ESC Acute Coronary Syndrome Guidelines 2023.`,
  },
  {
    topics: ['stroke', 'brain attack', 'face drooping', 'arm weakness', 'speech difficulty', 'fast', 'tia'],
    content: `Stroke: A brain attack caused by blocked or burst blood vessels in the brain.
FAST signs: Face drooping, Arm weakness, Speech difficulty, Time to call emergency.
Types: Ischemic stroke (clot, 87% of cases) and Hemorrhagic stroke (bleed).
IMPORTANT: Stroke is a medical emergency. Call 999 immediately. Every minute counts — early treatment saves brain cells.
Risk factors: hypertension, atrial fibrillation, diabetes, smoking, high cholesterol, obesity.
Source: WHO Stroke Guidelines, AHA/ASA Stroke Guidelines 2021.`,
  },
  {
    topics: ['depression', 'anxiety', 'mental health', 'mood', 'stress', 'panic', 'phobia', 'ocd'],
    content: `Mental Health — Depression & Anxiety:
Depression symptoms: persistent sadness, loss of interest, fatigue, changes in appetite/sleep, difficulty concentrating, feelings of worthlessness, thoughts of self-harm.
Anxiety symptoms: excessive worry, restlessness, irritability, muscle tension, sleep disturbance, panic attacks.
Management: psychotherapy (CBT), antidepressants (SSRIs), lifestyle changes (exercise, sleep hygiene, social support).
IMPORTANT: If you or someone you know is having thoughts of self-harm or suicide, contact a mental health crisis line or go to the nearest emergency department immediately.
Source: WHO Mental Health Action Plan, NICE Depression Guidelines 2022.`,
  },
  {
    topics: ['dehydration', 'water', 'hydration', 'electrolytes', 'oral rehydration', 'diarrhea'],
    content: `Dehydration: Insufficient fluid in the body.
Signs: dry mouth, dark urine, dizziness, fatigue, reduced urination, confusion in severe cases.
Management: increase fluid intake (water, oral rehydration salts for moderate/severe cases). Seek medical attention for inability to keep fluids down, severe diarrhea/vomiting, or confusion.
Daily water recommendation: approximately 2–3 litres for adults (varies with climate, activity, health status).
Source: WHO Diarrhea Treatment Guidelines, NHS Dehydration Guidance.`,
  },
  {
    topics: ['blood test', 'complete blood count', 'cbc', 'hemoglobin', 'white blood cell', 'platelet', 'creatinine', 'liver function', 'hba1c'],
    content: `Common Blood Tests:
CBC (Complete Blood Count): Measures red blood cells (normal Hb: 12-17.5 g/dL), white blood cells (4,000-11,000/μL), platelets (150,000-400,000/μL).
HbA1c: Measures average blood sugar over 3 months. Normal: <5.7%; Prediabetes: 5.7–6.4%; Diabetes: ≥6.5%.
Creatinine: Kidney function marker. Normal: 0.7–1.3 mg/dL (men), 0.5–1.1 mg/dL (women).
LFT (Liver Function Tests): ALT, AST, bilirubin assess liver health.
Note: Reference ranges vary by laboratory. Always interpret results with your doctor.
Source: WHO Laboratory Reference Ranges, NHS Blood Test Guidelines.`,
  },
];

/**
 * Retrieves relevant medical context for a query.
 *
 * @param {string} query
 * @returns {Promise<{ source: string, chunks: string[] }>}
 */
async function retrieve(query) {
  const q = query.toLowerCase();

  // Stage 1: OpenFDA for drug-specific queries
  if (DRUG_QUERY_PATTERN.test(query)) {
    const fdaResult = await _queryOpenFDA(query);
    if (fdaResult) return fdaResult;
  }

  // Stage 2: Static knowledge base keyword search
  const kbResult = _searchStaticKB(q);
  if (kbResult.chunks.length > 0) return kbResult;

  // Stage 3: Nothing found — return empty so LLM knows to say "not in KB"
  return { source: 'none', chunks: [] };
}

async function _queryOpenFDA(query) {
  try {
    // Extract likely drug name from query (first noun-like token near known drug terms)
    const drugMatch = query.match(
      /\b(aspirin|paracetamol|acetaminophen|ibuprofen|metformin|amoxicillin|omeprazole|atorvastatin|lisinopril|amlodipine|metoprolol|losartan|azithromycin|cetirizine|loratadine|insulin|warfarin|clopidogrel|pantoprazole|sertraline|fluoxetine|salbutamol|prednisone|dexamethasone|ciprofloxacin)\b/i
    );

    if (!drugMatch) return null;

    const drugName = drugMatch[1];
    const response = await axios.get(OPENFDA_LABEL_URL, {
      params: {
        search: `openfda.generic_name:"${drugName}"`,
        limit: 1,
      },
      timeout: OPENFDA_TIMEOUT_MS,
    });

    const result = response.data?.results?.[0];
    if (!result) return null;

    const chunks = [];

    const name = result.openfda?.generic_name?.[0] || drugName;
    const brandNames = result.openfda?.brand_name?.slice(0, 3).join(', ') || 'N/A';

    if (result.indications_and_usage?.[0]) {
      chunks.push(`${name} — Uses: ${result.indications_and_usage[0].slice(0, 600)}`);
    }
    if (result.warnings?.[0]) {
      chunks.push(`${name} — Warnings: ${result.warnings[0].slice(0, 600)}`);
    }
    if (result.drug_interactions?.[0]) {
      chunks.push(`${name} — Drug Interactions: ${result.drug_interactions[0].slice(0, 600)}`);
    }
    if (result.dosage_and_administration?.[0]) {
      chunks.push(`${name} — Dosage: ${result.dosage_and_administration[0].slice(0, 400)}`);
    }
    if (result.adverse_reactions?.[0]) {
      chunks.push(`${name} — Adverse Reactions: ${result.adverse_reactions[0].slice(0, 400)}`);
    }

    if (chunks.length === 0) return null;

    chunks.unshift(`Drug: ${name} (Brand names: ${brandNames})`);
    return { source: `OpenFDA Drug Label — ${name}`, chunks };
  } catch (err) {
    console.warn('[MedicalRetriever] OpenFDA query failed:', err.message);
    return null;
  }
}

function _searchStaticKB(query) {
  const scored = STATIC_KB.map((entry) => {
    const score = entry.topics.reduce((acc, topic) => {
      return acc + (query.includes(topic) ? topic.split(' ').length : 0);
    }, 0);
    return { score, content: entry.content };
  }).filter((e) => e.score > 0);

  scored.sort((a, b) => b.score - a.score);

  const topChunks = scored.slice(0, 2).map((e) => e.content);
  return {
    source: topChunks.length > 0 ? 'Livora Medical Knowledge Base (WHO/CDC/NHS Guidelines)' : 'none',
    chunks: topChunks,
  };
}

module.exports = { retrieve };
