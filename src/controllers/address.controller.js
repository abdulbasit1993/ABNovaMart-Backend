const mongoose = require("mongoose");
const { Address } = require("../models");

exports.createAddress = async (req, res) => {
  try {
    const userId = req.user?._id;

    const { shippingAddress, billingAddress, sameAsShipping } = req.body;

    let createdAddresses = [];

    // Case 1: Same Billing and Shipping
    if (sameAsShipping) {
      const shipping = await Address.create({
        ...shippingAddress,
        userId,
        addressType: "shipping",
        isDefault: true,
      });

      const billing = await Address.create({
        ...shippingAddress,
        userId,
        addressType: "billing",
        isDefault: true,
      });

      createdAddresses = [shipping, billing];
    } else {
      // Case 2: Different Billing Address

      const shipping = await Address.create({
        ...shippingAddress,
        userId,
        addressType: "shipping",
        isDefault: true,
      });

      const billing = await Address.create({
        ...billingAddress,
        userId,
        addressType: "billing",
        isDefault: true,
      });

      createdAddresses = [shipping, billing];
    }

    return res.status(201).json({
      success: true,
      data: createdAddresses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserAddresses = async (req, res) => {
  try {
    const userId = req.user?._id;

    const addresses = await Address.find({ userId }).sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAddressById = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const address = await Address.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findByIdAndDelete(req.params.id);

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const address = await Address.findById(id);

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    await Address.updateMany(
      { userId, addressType: address.addressType },
      { isDefault: false },
    );

    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
