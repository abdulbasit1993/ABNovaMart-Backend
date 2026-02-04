const express = require("express");
const router = express.Router();
const { addNewProduct } = require("../controllers/product.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/role.middleware");

router.post("/add", authenticate, isAdmin, addNewProduct);

module.exports = router;
