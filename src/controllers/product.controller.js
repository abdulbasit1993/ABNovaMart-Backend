const { Product } = require("../models");
const { createProductSchema } = require("../validators/product.validator");
const { uploadImageBuffer } = require("../services/cloudinary.service");

exports.addNewProduct = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createProductSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    // Handle image uploads to Cloudinary
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadImageBuffer(
            file.buffer,
            file.originalname,
          );
          imageUrls.push(result.url);
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          return res.status(500).json({
            success: false,
            message: "Error uploading image to Cloudinary",
            error: uploadError.message,
          });
        }
      }
    }

    // Create product with validated data and uploaded images
    const product = new Product({
      ...value,
      images: imageUrls.length > 0 ? imageUrls : req.body.images || [],
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
