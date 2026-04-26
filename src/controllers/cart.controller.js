const mongoose = require("mongoose");
const { Product } = require("../models");
const { addCartItemSchema } = require("../validators/cart.validator");

const { Cart } = require("../models/cart/cart.model.js");
const { CartItem } = require("../models/cart/cartItem.model.js");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getOrCreateActiveCart = async (userId) => {
  let cart = await Cart.findOne({ userId, status: "ACTIVE" });
  if (!cart) {
    cart = await Cart.create({ userId });
  }
  return cart;
};

const buildCartResponse = async (cart) => {
  const items = await CartItem.find({ cartId: cart._id }).populate("productId");

  let totalQuantity = 0;
  let subtotal = 0;

  const mappedItems = items.map((item) => {
    totalQuantity += item.quantity;
    const priceNumber = item.price ? parseFloat(item.price.toString()) : 0;
    subtotal += priceNumber * item.quantity;

    return {
      _id: item._id,
      productId: item.productId._id,
      product: item.productId,
      quantity: item.quantity,
      price: item.price,
    };
  });

  return {
    cart: {
      _id: cart._id,
      userId: cart.userId,
      status: cart.status,
      created_at: cart.created_at,
      updated_at: cart.updated_at,
    },
    items: mappedItems,
    summary: {
      itemsCount: mappedItems.length,
      totalQuantity,
      subtotal,
    },
  };
};

const addItemToCartForUserId = async (req, res, userId) => {
  try {
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const { error, value } = addCartItemSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    if (!isValidObjectId(value.productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    const product = await Product.findById(value.productId);
    if (!product || product.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const cart = await getOrCreateActiveCart(userId);

    let cartItem = await CartItem.findOne({
      cartId: cart._id,
      productId: product._id,
    });

    const existingQty = cartItem ? cartItem.quantity : 0;
    const newQty = existingQty + value.quantity;

    if (typeof product.stock === "number" && product.stock >= 0) {
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: "Requested quantity exceeds available stock",
        });
      }
    }

    if (cartItem) {
      cartItem.quantity = newQty;
      cartItem.price = product.price;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cartId: cart._id,
        productId: product._id,
        quantity: value.quantity,
        price: product.price,
      });
    }

    const data = await buildCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      data,
    });
  } catch (error) {
    if (error && error.code === 11000) {
      // unique index (cartId + productId) collision; retry as update
      try {
        const cart = await getOrCreateActiveCart(userId);
        const { quantity, productId } = req.body || {};
        const product = await Product.findById(productId);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: "Product not found",
          });
        }
        const item = await CartItem.findOne({ cartId: cart._id, productId });
        if (item) {
          item.quantity = item.quantity + (parseInt(quantity, 10) || 0);
          item.price = product.price;
          await item.save();
        }
        const data = await buildCartResponse(cart);
        return res.status(200).json({
          success: true,
          message: "Item added to cart successfully",
          data,
        });
      } catch (retryError) {
        return res.status(500).json({
          success: false,
          message: "Internal Server Error",
          error: retryError.message,
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.addCartItem = async (req, res) => {
  const userId = req.user?._id;
  return addItemToCartForUserId(req, res, userId);
};

exports.addCartItemForUser = async (req, res) => {
  return addItemToCartForUserId(req, res, req.params.userId);
};

const updateCartItemQuantityForUserId = async (req, res, userId) => {
  try {
    const productId = req.params.productId;
    const { quantity } = req.body;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cart = await getOrCreateActiveCart(userId);

    const cartItem = await CartItem.findOne({
      cartId: cart._id,
      productId,
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    const product = await Product.findById(productId);

    if (!product || product.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (typeof product.stock === "number" && product.stock >= 0) {
      if (quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: "Requested quantity exceeds available stock",
        });
      }
    }

    cartItem.quantity = quantity;
    cartItem.price = product.price;
    await cartItem.save();

    const data = await buildCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

const getCartForUserId = async (req, res, userId) => {
  try {
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const cart = await getOrCreateActiveCart(userId);
    const data = await buildCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getMyCart = async (req, res) => {
  return getCartForUserId(req, res, req.user?._id);
};

exports.getCartByUserId = async (req, res) => {
  return getCartForUserId(req, res, req.params.userId);
};

exports.updateCartItemQuantity = async (req, res) => {
  const userId = req.user?._id;
  return updateCartItemQuantityForUserId(req, res, userId);
};

exports.updateCartItemQuantityForUser = async (req, res) => {
  return updateCartItemQuantityForUserId(req, res, req.params.userId);
};

const clearCartForUserId = async (req, res, userId) => {
  try {
    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const cart = await Cart.findOne({ userId, status: "ACTIVE" });
    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
        data: {
          cart: null,
          items: [],
          summary: { itemsCount: 0, totalQuantity: 0, subtotal: 0 },
        },
      });
    }

    await CartItem.deleteMany({ cartId: cart._id });

    const data = await buildCartResponse(cart);

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.clearMyCart = async (req, res) => {
  return clearCartForUserId(req, res, req.user?._id);
};

exports.clearCartForUser = async (req, res) => {
  return clearCartForUserId(req, res, req.params.userId);
};
