import { Category } from "../models/index.js";
import {
  createProductCategorySchema,
  updateProductCategorySchema,
} from "../validators/productCategory.validator.js";

export const createProductCategory = async (req, res) => {
  try {
    const { error } = createProductCategorySchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res
        .status(400)
        .json({ success: false, message: "Validation Error", errors });
    }

    const { name, slug, parentId } = req.body;

    const category = await Category.create({ name, slug, parentId });

    res.status(201).json({
      success: true,
      message: "Product category created successfully",
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getAllProductCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const totalCategories = await Category.countDocuments(query);
    const totalPages = Math.ceil(totalCategories / limit);

    const categories = await Category.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Product categories fetched successfully",
      categories,
      pagination: {
        currentPage: page,
        totalPages,
        totalCategories,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getProductCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Product category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product category fetched successfully",
      data: category,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const updateProductCategory = async (req, res) => {
  try {
    const { error } = updateProductCategorySchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res
        .status(400)
        .json({ success: false, message: "Validation Error", errors });
    }

    const { name, slug, parentId } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, slug, parentId },
      { new: true },
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Product category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product category updated successfully",
      data: category,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const deleteProductCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Product category not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product category deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
