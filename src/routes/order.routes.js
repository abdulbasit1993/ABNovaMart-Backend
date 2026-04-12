const express = require("express");
const router = express.Router();

const { authenticate } = require("../middlewares/auth.middleware");
const { isAdmin } = require("../middlewares/role.middleware");

const {
  checkout,
  getUserOrders,
  getAllOrders,
  updateOrder,
} = require("../controllers/order.controller");

router.post("/checkout", authenticate, checkout);

router.get("/me", authenticate, getUserOrders);

router.get("/", authenticate, isAdmin, getAllOrders);

router.put("/:id", authenticate, isAdmin, updateOrder);

module.exports = router;
