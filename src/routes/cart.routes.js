const express = require("express");
const router = express.Router();

const { authenticate } = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/role.middleware");

const {
  addCartItem,
  getMyCart,
  clearMyCart,
  getCartByUserId,
  addCartItemForUser,
  clearCartForUser,
} = require("../controllers/cart.controller");

// Current user cart
router.get("/", authenticate, getMyCart);
router.post("/items", authenticate, addCartItem);
router.delete("/", authenticate, clearMyCart);

// Admin: operate on a specific user's cart
router.get("/user/:userId", authenticate, isAdmin, getCartByUserId);
router.post("/user/:userId/items", authenticate, isAdmin, addCartItemForUser);
router.delete("/user/:userId", authenticate, isAdmin, clearCartForUser);

module.exports = router;

