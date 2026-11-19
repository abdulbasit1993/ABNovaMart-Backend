const { Product, Category } = require("../models");
const { createProductSchema } = require("../validators/product.validator");
const { uploadImageBuffer } = require("../services/cloudinary.service");
const { default: mongoose } = require("mongoose");

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

exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const categoryId = req.query.categoryId;
    const skip = (page - 1) * limit;

    const query = { isActive: true };

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID format"
        });
      }
      const exists = await Category.findById(categoryId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: "Category not found"
        });
      }

      query.categoryId = categoryId;
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getProductsGroupedByCategory = async (req, res) => {
  try {
    const limitPerCategory = Math.min(
      parseInt(req.query.limitPerCategory) || 8,
      24,
    );

    const grouped = await Product.aggregate([
      { $match: { isActive: true } },
      { $sort: { created_at: -1 }},
      {
        $group: {
          _id: "$categoryId",
          totalProducts: { $sum: 1 },
          products: { $push: "$$ROOT" }, 
        },
      },
      // keep only N products per category, keep full count for "View all (123)"
      { $addFields: { products: { $slice: ["$products", limitPerCategory] } } },
      {
        $addFields: {
          products: {
            $map: {
              input: "$products",
              as: "p",
              in: { $mergeObjects: ["$$p", { price: { $toDouble: "$$p.price" } }] },
            },
          },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      { 
        $project: {
          _id: 0,
          category: { _id: "$category._id", name: "$category.name", slug: "$category.slug" },
          totalProducts: 1,
          products: 1
      }
    },
    { $sort: { "category.name": 1 } },
    ]);

    res.status(200).json({
      success: true,
      message: "Category-wise products fetched successfully",
      totalCategories: grouped.length,
      data: grouped
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;

    const product = await Product.findByIdAndUpdate(productId, updateData, {
      new: true,
    });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
