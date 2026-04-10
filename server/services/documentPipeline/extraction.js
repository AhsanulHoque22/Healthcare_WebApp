const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const { preprocessImage } = require('./preprocessing');

/**
 * Stage: OCR / Text Extraction
 * Extracts raw text from document URLs (PDFs or Images)
 */
async function extractTextFromURL(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'] || '';

    // Direct text extraction for PDFs
    if (contentType.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      // Fallback to OCR could be added here if data.text is empty or unreadable
      return data.text;
    } 
    // Image OCR with Tesseract
    else {
      const processedBuffer = await preprocessImage(buffer);
      const { data: { text } } = await Tesseract.recognize(processedBuffer, 'eng', {
         // suppress logging for production
         logger: () => {} 
      });
      return text;
    }
  } catch (err) {
    console.error(`[Pipeline] Failed to extract text from ${url}:`, err.message);
    throw new Error("Extraction failed");
  }
}

module.exports = { extractTextFromURL };
