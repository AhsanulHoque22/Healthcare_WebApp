/**
 * Stage: Strict Validation Engine
 * Cross validates numbers with dictionary logical ranges and calculates status mapping.
 */
const { MED_KNOWLEDGE, normalizeUnits } = require('./normalization');

function normalizeAndValidate(parsedData) {
   const validated = JSON.parse(JSON.stringify(parsedData));
   let validationFailures = 0;

   // 1. Lab Results Validation
   validated.labResults = validated.labResults.map(lab => {
      let isFlagged = false;
      let flagReason = null;
      let calculatedStatus = lab.status || 'unknown';
      
      const reference = MED_KNOWLEDGE[lab.test];

      // A. Pure numeric validation
      if (typeof lab.value !== 'number' || isNaN(lab.value)) {
         // It might be a text result. Preserve LLM extracted status without penalty.
      } else if (reference) {
         const normLabUnit = lab.unit ? normalizeUnits(lab.unit) : 'unknown';
         const unitMatches = !lab.unit || normLabUnit === 'unknown' || String(normLabUnit).toLowerCase() === String(reference.stdUnit).toLowerCase();
         
         if (unitMatches) {
             // B. Range Validation
             if (lab.value < reference.critMin || lab.value > reference.critMax) {
                 isFlagged = true;
                 calculatedStatus = 'CRITICAL';
                 flagReason = `Clinically impossible or critical boundary for ${lab.test}. Expected inside [${reference.critMin}, ${reference.critMax}]`;
                 validationFailures++;
             } else if (lab.value < reference.min) {
                 calculatedStatus = 'LOW';
             } else if (lab.value > reference.max) {
                 calculatedStatus = 'HIGH';
             } else {
                 calculatedStatus = 'NORMAL';
             }
         } else {
             // C. Unit Consistency
             isFlagged = true;
             flagReason = `Unit consistency mismatch. Expected ${reference.stdUnit}, got ${lab.unit}`;
             validationFailures++;
         }
      }

      return {
         ...lab,
         status: calculatedStatus,
         isFlagged,
         flagReason
      };
   });

   // Resolve Duplicates - Prioritize explicitly latest or unflagged
   const uniqueLabs = [];
   const seenTests = new Set();
   // Reverse ensures we keep the 'latest' processed if linear parse order equals chronological bottom-to-top
   validated.labResults.reverse().forEach(lab => {
      if (!seenTests.has(lab.test)) {
         seenTests.add(lab.test);
         uniqueLabs.push(lab);
      } else {
         // Conflict detected. If the previous was flagged and this is clean, take this one
         const existingIndex = uniqueLabs.findIndex(x => x.test === lab.test);
         if (uniqueLabs[existingIndex].isFlagged && !lab.isFlagged) {
             uniqueLabs[existingIndex] = lab;
         }
      }
   });
   validated.labResults = uniqueLabs.reverse();

   // Clean Diagnoses
   validated.diagnoses = validated.diagnoses.filter(d => d.condition && d.condition.length > 0);

   // Adjust Traceability Confidence Score
   if (validationFailures > 0) {
       validated.confidence_score = Math.max(0.2, validated.confidence_score - (validationFailures * 0.15));
   }
   
   return validated;
}

module.exports = { normalizeAndValidate };
