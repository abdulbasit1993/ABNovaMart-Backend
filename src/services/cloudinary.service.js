// src/services/cloudinary.service.js
// Cloudinary service for uploading and deleting images

const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Initialize Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer storage configuration for memory storage (no temporary files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

/**
 * Upload an image buffer to Cloudinary.
 * @param {Buffer} buffer - The file buffer to upload
 * @param {string} originalname - The original filename
 * @returns {Object} - { url, public_id }
 */
async function uploadImageBuffer(buffer, originalname) {
  try {
    const result = await cloudinary.uploader.upload(buffer, {
      folder: "abnovamart/products",
      public_id: `${originalname}-${Date.now()}`,
      overwrite: true,
    });

    return { url: result.secure_url, public_id: result.public_id };
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw err;
  }
}

/**
 * Upload an image to Cloudinary (Express middleware style).
 * @param {Object} req - Express request object (must contain a file field)
 * @param {Object} res - Express response object
 */
async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.buffer, {
      folder: "abnovamart",
      public_id: `${req.file.originalname}-${Date.now()}`,
      overwrite: true,
    });

    // Clean up temporary file (if any)
    if (req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    return res
      .status(200)
      .json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return res.status(500).json({ message: "Error uploading image" });
  }
}

/**
 * Delete an image from Cloudinary by its public ID.
 * @param {string} publicId - The public ID of the image to delete
 */
async function deleteImage(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (err) {
    console.error("Cloudinary delete error:", err);
    return { success: false, message: err.message };
  }
}

module.exports = {
  upload,
  uploadImage,
  uploadImageBuffer,
  deleteImage,
};
