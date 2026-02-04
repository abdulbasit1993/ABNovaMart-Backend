const Joi = require("joi");

const registerUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
  firstName: Joi.string().required().messages({
    "any.required": "First name is required",
  }),
  lastName: Joi.string().required().messages({
    "any.required": "Last name is required",
  }),
  phone: Joi.string()
    .pattern(/^[0-9]+$/)
    .min(10)
    .max(15)
    .messages({
      "string.pattern.base": "Phone number should only contain numbers",
      "string.min": "Phone number should be at least 10 digits long",
      "string.max": "Phone number should not exceed 15 digits",
    }),
  role: Joi.string().valid("ADMIN", "USER").default("USER"),
});

const loginUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters long",
    "any.required": "Password is required",
  }),
});

module.exports = { registerUserSchema, loginUserSchema };
