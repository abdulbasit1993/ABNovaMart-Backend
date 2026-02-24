const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth.middleware");
const {
  getUserProfile,
  getAllUsers,
} = require("../controllers/user.controller");
const { isAdmin } = require("../middlewares/role.middleware");

router.get("/me", authenticate, getUserProfile);

router.get("/", authenticate, isAdmin, getAllUsers);

module.exports = router;
