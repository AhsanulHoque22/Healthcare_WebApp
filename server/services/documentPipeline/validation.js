/**
 * Stage: Strict Validation Engine
 * Cross validates numbers with dictionary logical ranges and calculates status mapping.
 */
const { MED_KNOWLEDGE } = require('./normalization');

function normalizeAndValidate(parsedData) {
   const validated = JSON.parse(JSON.stringify(parsedData));
   let validationFailures = 0;

   // 1. Lab Results Validation
   validated.labResults = validated.labResults.map(lab => {
      let isFlagged = false;
      let flagReason = null;
      let calculatedStatus = 'NORMAL';
      
      const reference = MED_KNOWLEDGE[lab.test];

      // A. Pure numeric validation
      if (typeof lab.value !== 'number' || isNaN(lab.value) || lab.value < 0) {
         isFlagged = true;
         flagReason = "Invalid numeric lab result format.";
         validationFailures += 2;
      } else if (reference) {
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
         }
         
         // C. Unit Consistency
         if (lab.unit && lab.unit !== reference.stdUnit && lab.unit !== 'unknown') {
             // In severe unit mismatches not fixed by conversion Engine, flag
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
