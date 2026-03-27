const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the local file
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<object>} - Cloudinary upload result
 */
const uploadToCloudinary = async (filePath, folder = 'healthcare_app') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto' // Automatically detect file type (image, video, raw/pdf)
    });
    
    // Optional: Delete the local file after upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return result;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    // Even if upload fails, we should handle the local file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @returns {Promise<object>} - Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary
};
