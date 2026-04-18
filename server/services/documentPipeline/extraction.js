const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const { preprocessImage } = require('./preprocessing');

// Ensure Cloudinary is configured (uses same config as cloudinaryService)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Stage: OCR / Text Extraction
 * Extracts raw text from document URLs (PDFs or Images)
 */
async function extractTextFromURL(url) {
  try {
    let buffer;
    let contentType = '';

    // If it's a Cloudinary URL, use SDK to fetch it securely (handles 401/private files)
    if (url.includes('cloudinary.com')) {
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        buffer = Buffer.from(response.data);
        contentType = response.headers['content-type'] || '';
      } catch (err) {
        if (err.response?.status === 401) {
          console.log(`[Extraction] 401 Detected. Attempting to fetch with signed URL...`);
          // Extract public ID from the URL
          // URL pattern: .../upload/v12345/folder/id.extension or .../upload/folder/id.extension
          const urlParts = url.split('/');
          const uploadIndex = urlParts.indexOf('upload');
          if (uploadIndex !== -1) {
            const resourceType = urlParts[uploadIndex - 1] || 'image'; // 'image' or 'raw'
            // Remove everything up to and including 'upload'
            const postUploadParts = urlParts.slice(uploadIndex + 1);
            // Remove the version (starts with 'v') if present
            if (postUploadParts[0].startsWith('v')) {
              postUploadParts.shift();
            }
            const fullId = postUploadParts.join('/');
            const extension = fullId.substring(fullId.lastIndexOf('.') + 1);
            // For 'raw' resources, public_id includes the extension
            const publicId = resourceType === 'raw' ? fullId : fullId.substring(0, fullId.lastIndexOf('.'));
            
            console.log(`[Extraction] Derived Public ID: ${publicId}, Format: ${extension}, Type: ${resourceType}`);
            
            const urlOptions = {
              sign_url: true,
              resource_type: resourceType,
              secure: true
            };

            // Only add format for non-raw resources
            if (resourceType !== 'raw') {
              urlOptions.format = extension;
            }

            const signedUrl = cloudinary.url(publicId, urlOptions);
            
            console.log(`[Extraction] Retrying with signed URL: ${signedUrl.substring(0, 80)}...`);
            const signedResponse = await axios.get(signedUrl, { responseType: 'arraybuffer' });
            buffer = Buffer.from(signedResponse.data);
            contentType = signedResponse.headers['content-type'] || '';
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
    } else {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      buffer = Buffer.from(response.data);
      contentType = response.headers['content-type'] || '';
    }

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
    console.error(`[Pipeline Error] ${url}:`, err.message);
    if (err.stack) {
      console.error(err.stack.split('\n').slice(0, 3).join('\n'));
    }
    throw new Error(`Extraction failed: ${err.message}`);
  }
}

module.exports = { extractTextFromURL };
