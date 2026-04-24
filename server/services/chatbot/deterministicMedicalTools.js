/**
 * deterministicMedicalTools.js
 *
 * Drug interaction and dosage lookups backed by the OpenFDA API.
 * The LLM orchestrates these tools but NEVER generates the core data —
 * all factual content comes from the FDA API response.
 *
 * The LLM's only job after calling these tools is to present the
 * returned data in plain English.
 */

const axios = require('axios');

const OPENFDA_BASE = 'https://api.fda.gov/drug';
const TIMEOUT_MS = 8000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function _truncate(text, max = 800) {
  if (!text || typeof text !== 'string') return null;
  return text.length > max ? text.slice(0, max) + '… [see full label]' : text;
}

async function _fetchDrugLabel(drugName) {
  const searches = [
    `openfda.generic_name:"${drugName}"`,
    `openfda.brand_name:"${drugName}"`,
    `openfda.substance_name:"${drugName}"`,
  ];

  for (const search of searches) {
    try {
      const { data } = await axios.get(`${OPENFDA_BASE}/label.json`, {
        params: { search, limit: 1 },
        timeout: TIMEOUT_MS,
      });
      if (data.results?.length > 0) return data.results[0];
    } catch (err) {
      if (err.response?.status === 404) continue;
      throw err;
    }
  }
  return null;
}

// ── Tool: check_drug_interaction ──────────────────────────────────────────────

/**
 * Checks known interactions between two drugs using FDA drug label data.
 * Returns factual interaction text from the label — no LLM generation.
 */
async function checkDrugInteraction({ drugA, drugB }) {
  if (!drugA || !drugB) {
    return { error: true, message: 'Both drug names are required.' };
  }

  let labelA = null;
  let labelB = null;
  let fetchError = false;

  try {
    [labelA, labelB] = await Promise.all([
      _fetchDrugLabel(drugA.trim()),
      _fetchDrugLabel(drugB.trim()),
    ]);
  } catch (err) {
    console.error('[checkDrugInteraction] OpenFDA fetch failed:', err.message);
    fetchError = true;
  }

  if (fetchError || (!labelA && !labelB)) {
    return {
      error: true,
      source: 'OpenFDA',
      message: `Could not retrieve drug label data for "${drugA}" or "${drugB}" from the FDA database. Please consult a pharmacist or prescribing physician directly.`,
    };
  }

  const nameA = labelA?.openfda?.generic_name?.[0] || drugA;
  const nameB = labelB?.openfda?.generic_name?.[0] || drugB;

  const interactionsA = _truncate(labelA?.drug_interactions?.[0]);
  const interactionsB = _truncate(labelB?.drug_interactions?.[0]);
  const warningsA = _truncate(labelA?.warnings?.[0]);
  const warningsB = _truncate(labelB?.warnings?.[0]);

  // Check if either label explicitly mentions the other drug
  const aMentionsB = interactionsA
    ? interactionsA.toLowerCase().includes(drugB.toLowerCase()) ||
      interactionsA.toLowerCase().includes(nameB.toLowerCase())
    : false;
  const bMentionsA = interactionsB
    ? interactionsB.toLowerCase().includes(drugA.toLowerCase()) ||
      interactionsB.toLowerCase().includes(nameA.toLowerCase())
    : false;

  const knownInteraction = aMentionsB || bMentionsA;

  return {
    source: 'OpenFDA Drug Label (FDA)',
    citation: `https://api.fda.gov/drug/label.json`,
    drugA: nameA,
    drugB: nameB,
    knownInteractionFound: knownInteraction,
    interactionDataA: interactionsA
      ? { drug: nameA, interactionSection: interactionsA }
      : null,
    interactionDataB: interactionsB
      ? { drug: nameB, interactionSection: interactionsB }
      : null,
    warningsA: warningsA ? { drug: nameA, warnings: warningsA } : null,
    warningsB: warningsB ? { drug: nameB, warnings: warningsB } : null,
    disclaimer:
      'This data is sourced directly from FDA drug labels. It may not cover all interactions. Always verify with your pharmacist or prescribing physician before combining medications.',
  };
}

// ── Tool: get_dosage_info ─────────────────────────────────────────────────────

/**
 * Returns FDA-label dosage and administration information for a drug.
 * Returns factual label data — no LLM generation.
 */
async function getDosageInfo({ drugName, condition }) {
  if (!drugName) {
    return { error: true, message: 'Drug name is required.' };
  }

  let label = null;
  try {
    label = await _fetchDrugLabel(drugName.trim());
  } catch (err) {
    console.error('[getDosageInfo] OpenFDA fetch failed:', err.message);
  }

  if (!label) {
    return {
      error: true,
      source: 'OpenFDA',
      message: `Could not find FDA label data for "${drugName}". This drug may not be in the FDA database, or may be known by a different name. Please consult your pharmacist.`,
    };
  }

  const genericName = label.openfda?.generic_name?.[0] || drugName;
  const brandNames = label.openfda?.brand_name?.slice(0, 3).join(', ') || 'N/A';
  const manufacturer = label.openfda?.manufacturer_name?.[0] || 'N/A';

  return {
    source: 'OpenFDA Drug Label (FDA)',
    citation: `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(genericName)}"&limit=1`,
    genericName,
    brandNames,
    manufacturer,
    indicationsAndUsage: _truncate(label.indications_and_usage?.[0]),
    dosageAndAdministration: _truncate(label.dosage_and_administration?.[0]),
    warnings: _truncate(label.warnings?.[0]),
    contraindications: _truncate(label.contraindications?.[0]),
    adverseReactions: _truncate(label.adverse_reactions?.[0], 500),
    condition: condition || null,
    disclaimer:
      'Dosage information is from the FDA drug label and is for general reference only. Individual dosing must be determined by a qualified healthcare provider based on your specific medical history, weight, kidney function, and other factors.',
  };
}

module.exports = { checkDrugInteraction, getDosageInfo };
