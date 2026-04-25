const sharp = require('sharp');

/**
 * Stage: Preprocessing
 * Applies transformations to raw image buffers for optimal OCR accuracy.
 */
async function preprocessImage(buffer) {
  try {
    const processedBuffer = await sharp(buffer)
      // Auto-rotate using EXIF orientation tag — fixes phone photos taken sideways
      .rotate()
      // 2000px is the sweet spot: ~235 DPI on a letter-size page (enough for
      // printed medical text) while using 36% fewer pixels than 2500px,
      // cutting Tesseract time and memory significantly on 3-4 MB phone photos
      .resize({ width: 2000, withoutEnlargement: true })
      // Grayscale
      .grayscale()
      // Normalize to simulate basic thresholding (improves contrast)
      .normalize()
      // Noise reduction/sharpening
      .sharpen()
      .toBuffer();
      
    return processedBuffer;
  } catch (error) {
    console.error('[Pipeline] Image preprocessing failed, falling back to original:', error.message);
    return buffer;
  }
}

module.exports = { preprocessImage };
