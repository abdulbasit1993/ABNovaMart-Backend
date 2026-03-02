const express = require("express");
const router = express.Router();
const {
  addNewProduct,
  getAllProducts,
  getProductById,
  deleteProduct,
  updateProduct,
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

// GET /products/:id - Get a specific product by ID
router.get("/:id", getProductById);

// DELETE /products/:id - Delete a product by ID
router.delete("/:id", authenticate, isAdmin, deleteProduct);

// PUT /products/:id - Update a product by ID with image uploads
router.put(
  "/:id",
  authenticate,
  isAdmin,
  upload.array("images", 10),
  updateProduct,
);

module.exports = router;
