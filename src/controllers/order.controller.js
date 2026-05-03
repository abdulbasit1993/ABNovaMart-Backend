const mongoose = require("mongoose");
const {
  Order,
  OrderItem,
  Cart,
  CartItem,
  Product,
  Address,
  User,
} = require("../models");
const { CartStatus } = require("../models/cart/cart.enums");
const { OrderStatus, PaymentStatus } = require("../models/order/order.enums");
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function calculateShipping(totalAmount) {
  if (totalAmount >= 1000) return 0; // Free shipping
  return 2;
}

async function checkout(req, res) {
  const session = await mongoose.startSession();

  let order;

  try {
    const userId = req.user?._id;

    console.log("Checkout initiated by user: ", userId);

    const { shippingAddressId, billingAddressId, sameAsShipping } = req.body;

    if (!shippingAddressId) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    session.startTransaction();

    // Validate shipping address belongs to the user
    const shippingAddress = await Address.findOne({
      _id: shippingAddressId,
      userId,
    }).session(session);

    if (!shippingAddress) {
      throw new Error("Invalid shipping address");
    }

    if (shippingAddress.addressType !== "shipping") {
      throw new Error("Address provided is not a shipping address");
    }

    let billingAddress;

    if (sameAsShipping) {
      billingAddress = shippingAddress;
    } else {
      if (!billingAddressId) {
        throw new Error("Billing address is required");
      }

      billingAddress = await Address.findOne({
        _id: billingAddressId,
        userId,
      }).session(session);

      if (!billingAddress) {
        throw new Error("Invalid billing address");
      }

      if (billingAddress.addressType !== "billing") {
        throw new Error("Address provided is not a billing address");
      }
    }

    const cart = await Cart.findOne({
      userId,
      status: "ACTIVE",
    }).session(session);

    console.log("Cart: ", cart);

    if (!cart) {
      throw new Error("No active cart found");
    }

    const cartItems = await CartItem.find({ cartId: cart._id })
      .populate("productId")
      .lean()
      .session(session);

    if (!cartItems.length) {
      throw new Error("Cart is empty");
    }

    // Calculate total amount + Stock Update (Atomic)
    let totalAmount = 0;

    for (let item of cartItems) {
      const product = item.productId;

      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: product._id,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
        { session, new: true },
      );

      if (!updatedProduct) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }

      totalAmount += Number(product.price) * item.quantity;
    }

    // Create an Order with paymentStatus: "PENDING"
    // and orderStatus: "PENDING"
    const createdOrders = await Order.create(
      [
        {
          userId,
          totalAmount,
          paymentStatus: "PENDING",
          orderStatus: "PENDING",
          shippingAddressId: shippingAddress._id,
          billingAddressId: billingAddress._id,

          // Snapshot of address details at the time of order
          shippingAddressSnapshot: shippingAddress.toObject(),
          billingAddressSnapshot: billingAddress.toObject(),
        },
      ],
      { session },
    );

    order = createdOrders[0];

    // Create OrderItems linked to the order and update stock
    const orderItemsData = cartItems.map((item) => ({
      orderId: order._id,
      productId: item.productId._id,
      quantity: item.quantity,
      price: item.productId.price,
    }));

    await OrderItem.insertMany(orderItemsData, { session });

    // Clear cart
    await CartItem.deleteMany({ cartId: cart._id }).session(session);

    cart.status = "ORDERED";
    await cart.save({ session });

    await session.commitTransaction();

    let paymentIntent;

    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: "usd",
        metadata: { orderId: order._id.toString(), userId: userId.toString() },
      });
    } catch (stripeError) {
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: "FAILED",
      });

      return res.status(500).json({
        success: false,
        message: "Payment initialization failed",
        error: stripeError.message,
      });
    }

    // Update order with payment intent ID
    order.paymentIntentId = paymentIntent.id;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order created successfully. Proceed to payment",
      data: {
        order,
        clientSecret: paymentIntent.client_secret,
      },
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Checkout error: ", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
}

// Retrieve orders for the authenticated user
async function getUserOrders(req, res) {
  try {
    const userId = req.user?._id;
    const orders = await Order.find({
      where: { userId },
      include: [{ model: OrderItem, include: [Product] }],
      order: [["createdAt", "desc"]],
    });
    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    console.log("Error fetching user orders: ", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

// Retrieve all orders (admin access only)
async function getAllOrders(req, res) {
  try {
    const orders = await Order.find({
      include: [
        { model: OrderItem, include: [Product] },
        { model: Address },
        {
          model: User,
          attributes: [
            "firstName",
            "lastName",
            "email",
            "phone",
            "role",
            "isVerified",
          ],
        },
      ],
      order: [["createdAt", "desc"]],
    });

    res.status(200).json({
      success: true,
      message: "All orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    console.log("Error fetching all orders: ", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

// Update order status (admin access only)
async function updateOrder(req, res) {
  try {
    const { id } = req.params;
    const { paymentStatus, orderStatus } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update fields
    if (paymentStatus && PaymentStatus.includes(paymentStatus)) {
      order.paymentStatus = paymentStatus;
    }
    if (orderStatus && OrderStatus.includes(orderStatus)) {
      order.orderStatus = orderStatus;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    console.log("Error updating order: ", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

module.exports = {
  checkout,
  getUserOrders,
  getAllOrders,
  updateOrder,
};
