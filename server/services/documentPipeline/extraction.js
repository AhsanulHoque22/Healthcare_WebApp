const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const { execFile } = require('child_process');
const { promises: fsPromises } = require('fs');
const path = require('path');
const os = require('os');
const { preprocessImage } = require('./preprocessing');

/**
 * Converts the first page of a PDF buffer to a JPEG image using pdftoppm,
 * then runs Tesseract OCR on the result.
 * Used when pdf-parse returns no text (scanned/image-based PDFs).
 */
async function _ocrScannedPDF(pdfBuffer) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const tmpPdf = path.join(os.tmpdir(), `livora_${id}.pdf`);
  const tmpPrefix = path.join(os.tmpdir(), `livora_${id}_p`);

  try {
    await fsPromises.writeFile(tmpPdf, pdfBuffer);

    // -r 300: 300 DPI  -jpeg: output format  -l 1: only first page
    await new Promise((resolve, reject) => {
      execFile('pdftoppm', ['-r', '300', '-jpeg', '-l', '1', tmpPdf, tmpPrefix], { timeout: 30000 }, (err) => {
        if (err) reject(new Error(`pdftoppm failed: ${err.message}`));
        else resolve();
      });
    });

    // pdftoppm names output files like prefix-1.jpg or prefix-01.jpg
    const tmpDir = os.tmpdir();
    const allFiles = await fsPromises.readdir(tmpDir);
    const outFile = allFiles.find(f => f.startsWith(path.basename(tmpPrefix)));
    if (!outFile) throw new Error('pdftoppm produced no output image');

    const imgBuffer = await fsPromises.readFile(path.join(tmpDir, outFile));
    const processedBuffer = await preprocessImage(imgBuffer);

    const worker = await Tesseract.createWorker('eng', 1, { logger: () => {} });
    try {
      await worker.setParameters({ tessedit_pageseg_mode: '6' });
      const { data: { text } } = await worker.recognize(processedBuffer);
      console.log(`[Extraction] Scanned PDF OCR extracted ${text.trim().length} chars`);
      return text;
    } finally {
      await worker.terminate();
    }
  } finally {
    // Clean up temp files regardless of outcome
    await fsPromises.unlink(tmpPdf).catch(() => {});
    const tmpDir = os.tmpdir();
    const allFiles = await fsPromises.readdir(tmpDir).catch(() => []);
    for (const f of allFiles.filter(f => f.startsWith(`livora_${id}`))) {
      await fsPromises.unlink(path.join(tmpDir, f)).catch(() => {});
    }
  }
}

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
            
            // Fetch the exact resource info from Cloudinary API to get the correct version and type
            const resource = await cloudinary.api.resource(publicId, { 
              resource_type: resourceType 
            });

            console.log(`[Extraction] API matched resource: Type=${resource.type}, Version=${resource.version}`);

            // Use private_download_url which is more robust for protected assets
            // It generates an api.cloudinary.com signed download link
            const deliveryTypes = [resource.type, 'upload', 'authenticated', 'private'];
            let lastError = null;

            for (const type of deliveryTypes) {
              try {
                const signedUrl = cloudinary.utils.private_download_url(publicId, extension, {
                  resource_type: resourceType,
                  type: type,
                  expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
                });

                console.log(`[Extraction] Trying delivery as ${type}: ${signedUrl.substring(0, 80)}...`);
                const signedResponse = await axios.get(signedUrl, { 
                  responseType: 'arraybuffer',
                  timeout: 15000 
                });
                
                buffer = Buffer.from(signedResponse.data);
                contentType = signedResponse.headers['content-type'] || '';
                console.log(`[Extraction] Successfully fetched as ${type} (Size: ${buffer.length} bytes)`);
                break; // Success!
              } catch (retryErr) {
                lastError = retryErr;
                console.log(`[Extraction] ${type} delivery failed (${retryErr.response?.status || retryErr.message})`);
              }
            }

            if (!buffer) {
              throw lastError;
            }
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
      const textLength = data.text.trim().length;

      // If pdf-parse returns very little text the PDF is image-based (scanned).
      // Fall back to pdftoppm → Tesseract OCR.
      if (textLength < 100) {
        console.log(`[Extraction] PDF text too short (${textLength} chars) — trying scanned-PDF OCR`);
        try {
          const ocrText = await _ocrScannedPDF(buffer);
          if (ocrText.trim().length > textLength) return ocrText;
        } catch (ocrErr) {
          console.warn(`[Extraction] Scanned-PDF OCR failed: ${ocrErr.message}`);
        }
      }

      return data.text;
    } 
    // Image OCR with Tesseract — use explicit worker lifecycle so WASM memory
    // is freed immediately after each document instead of waiting for GC
    else {
      const processedBuffer = await preprocessImage(buffer);
      const worker = await Tesseract.createWorker('eng', 1, { logger: () => {} });
      try {
        // PSM 6 = assume a single uniform block of text — best for structured
        // medical documents. Sharp's .rotate() already handles EXIF rotation,
        // so we don't need PSM 1's OSD (which requires osd.traineddata).
        await worker.setParameters({ tessedit_pageseg_mode: '6' });
        const { data: { text } } = await worker.recognize(processedBuffer);
        return text;
      } finally {
        await worker.terminate();
      }
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
