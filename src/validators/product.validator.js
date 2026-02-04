const Joi = require("joi");

const createProductSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Product name is required",
    "string.empty": "Product name cannot be empty",
  }),
  price: Joi.number().positive().required().messages({
    "any.required": "Price is required",
    "number.positive": "Price must be a positive number",
  }),
  description: Joi.string().optional().allow("", null),
  sku: Joi.string().required().messages({
    "any.required": "SKU is required",
    "string.empty": "SKU cannot be empty",
  }),
  stock: Joi.number().integer().min(0).default(0).messages({
    "number.min": "Stock cannot be negative",
    "number.integer": "Stock must be an integer",
  }),
  categoryId: Joi.string().required().messages({
    "any.required": "Category ID is required",
  }),
  images: Joi.array().items(Joi.string().uri()).optional().default([]),
  isActive: Joi.boolean().default(true),
  tags: Joi.array().items(Joi.string()).optional().default([]),
});

const updateProductSchema = Joi.object({
  name: Joi.string().messages({
    "string.empty": "Product name cannot be empty",
  }),
  price: Joi.number().positive().messages({
    "number.positive": "Price must be a positive number",
  }),
  description: Joi.string().optional().allow("", null),
  sku: Joi.string().messages({
    "string.empty": "SKU cannot be empty",
  }),
  stock: Joi.number().integer().min(0).messages({
    "number.min": "Stock cannot be negative",
    "number.integer": "Stock must be an integer",
  }),
  categoryId: Joi.string(),
  images: Joi.array().items(Joi.string().uri()).optional().default([]),
  isActive: Joi.boolean(),
  tags: Joi.array().items(Joi.string()).optional().default([]),
});

module.exports = { createProductSchema, updateProductSchema };
