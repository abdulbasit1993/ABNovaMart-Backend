const express = require("express");
const router = express.Router();
const {
  createProductCategory,
  getAllProductCategories,
  getProductCategoryById,
  updateProductCategory,
  deleteProductCategory,
} = require("../controllers/productCategory.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/role.middleware");

router.post("/add", authenticate, isAdmin, createProductCategory);

router.get("/", authenticate, getAllProductCategories);

router.get("/:id", authenticate, isAdmin, getProductCategoryById);

router.put("/:id", authenticate, isAdmin, updateProductCategory);

router.delete("/:id", authenticate, isAdmin, deleteProductCategory);

module.exports = router;
