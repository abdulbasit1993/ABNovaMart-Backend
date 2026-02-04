const express = require("express");
const router = express.Router();
const {
  addNewProduct,
  getAllProducts,
} = require("../controllers/product.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/role.middleware");
const { upload } = require("../services/cloudinary.service");

// POST /products/add - Add new product with image uploads
router.post(
  "/add",
  authenticate,
  isAdmin,
  upload.array("images", 10),
  addNewProduct,
);

// GET /products - Get all products with pagination and search
router.get("/", getAllProducts);

module.exports = router;
