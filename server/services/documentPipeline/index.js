const { retrieveUserDocuments } = require('./retrieval');
const { extractTextFromURL } = require('./extraction');
const { cleanOCRText } = require('./cleaning');
const { parseMedicalText } = require('./parsing');
const { normalizeAndValidate } = require('./validation');
const { DocumentCache } = require('../../models');

/**
 * Process a single document through the full pipeline
 */
async function processDocument(url) {
   try {
     // CACHING LOOKUP
     const cached = await DocumentCache.findByPk(url);
     if (cached && cached.extractedData && !cached.extractedData.error) {
        return cached.extractedData;
     }

     // 1. EXTRACT RAW TEXT (PDF / OCR + Sharp Preprocessing)
     const rawText = await extractTextFromURL(url);

     // 1b. CLEAN NOISY TEXT
     const cleanedText = cleanOCRText(rawText);

     // 2. PARSE DETERMINISTICALLY (+ Fallback LLM)
     const parsedData = await parseMedicalText(cleanedText);

     // 3. NORMALIZE & VALIDATE (Flag inconsistency)
     const validatedData = normalizeAndValidate(parsedData);

     // 4. CACHE RESULTS
     await DocumentCache.upsert({
        url,
        extractedData: validatedData
     });

     return validatedData;
   } catch (error) {
     console.error(`[Pipeline Orchestrator] Error processing ${url}:`, error.message);
     const failureData = { error: true, reason: "Extraction failed or unreadable document" };
     
     // Cache the failure conditionally so we don't spam retries on broken files
     await DocumentCache.upsert({
        url,
        extractedData: failureData
     });

     return failureData;
   }
}

/**
 * Retrieval API
 * Fetch, parse asynchronously, and aggregate all documents
 */
async function getParsedMedicalData(userId) {
   const urls = await retrieveUserDocuments(userId);
   const results = [];

   // Performance: Process asynchronously mapping all URLs
   const processingPromises = urls.map(async (url) => {
      const data = await processDocument(url);
      return { url, data };
   });

   // Wait for all queue workers (Promise queue)
   const settled = await Promise.allSettled(processingPromises);
   
   for (const result of settled) {
     if (result.status === 'fulfilled') {
       results.push(result.value);
     }
   }

   return results;
}

module.exports = {
  processDocument,
  getParsedMedicalData
};
