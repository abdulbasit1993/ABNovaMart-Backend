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
  updateCartItemQuantity,
  updateCartItemQuantityForUser,
} = require("../controllers/cart.controller");

// Current user cart
router.get("/", authenticate, getMyCart);
router.post("/items", authenticate, addCartItem);
router.patch("/items/:productId", authenticate, updateCartItemQuantity);
router.delete("/", authenticate, clearMyCart);

// Admin: operate on a specific user's cart
router.get("/user/:userId", authenticate, isAdmin, getCartByUserId);
router.post("/user/:userId/items", authenticate, isAdmin, addCartItemForUser);
router.patch(
  "/user/:userId/items/:productId",
  authenticate,
  isAdmin,
  updateCartItemQuantityForUser,
);
router.delete("/user/:userId", authenticate, isAdmin, clearCartForUser);

module.exports = router;
