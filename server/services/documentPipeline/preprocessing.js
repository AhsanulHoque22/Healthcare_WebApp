const sharp = require('sharp');

/**
 * Stage: Preprocessing
 * Applies transformations to raw image buffers for optimal OCR accuracy.
 */
async function preprocessImage(buffer) {
  try {
    const processedBuffer = await sharp(buffer)
      // Resize for clarity constraint (scale up without enlargement)
      .resize({ width: 2500, withoutEnlargement: true })
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
