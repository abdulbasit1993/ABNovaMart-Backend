const express = require("express");
const router = express.Router();

const { authenticate } = require("../middlewares/auth.middleware");

const {
  createAddress,
  getUserAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/address.controller");

router.post("/add", authenticate, createAddress);

router.get("/", authenticate, getUserAddresses);

router.get("/:id", authenticate, getAddressById);

router.put("/:id", authenticate, updateAddress);

router.delete("/:id", authenticate, deleteAddress);

router.patch("/:id/default", authenticate, setDefaultAddress);

module.exports = router;
