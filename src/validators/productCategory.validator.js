const Joi = require("joi");

const createProductCategorySchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
  }),
  slug: Joi.string().required().messages({
    "any.required": "Slug is required",
    "string.empty": "Slug cannot be empty",
  }),
  parentId: Joi.string().allow(null, "").optional(),
});

const updateProductCategorySchema = Joi.object({
  name: Joi.string().messages({
    "string.empty": "Name cannot be empty",
  }),
  slug: Joi.string().messages({
    "string.empty": "Slug cannot be empty",
  }),
  parentId: Joi.string().allow(null, "").optional(),
});

module.exports = { createProductCategorySchema, updateProductCategorySchema };
