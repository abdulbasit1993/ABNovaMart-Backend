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

async function checkout(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;

    const { shippingAddressId } = req.body;

    if (!shippingAddressId) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    // Validate shipping address belongs to the user
    const address = await Address.findOne({
      _id: shippingAddressId,
      userId,
    }).session(session);

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipping address",
      });
    }

    const cart = await Cart.findOne({
      userId,
      status: CartStatus.ACTIVE,
    }).session(session);

    if (!cart) {
      return res.status(400).json({
        success: false,
        message: "No active cart found",
      });
    }

    const cartItems = await CartItem.find({ cartId: cart._id })
      .populate("productId")
      .session(session);

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Verify stock availability
    for (let item of cartItems) {
      if (item.productId.stock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.productId.name}`,
        });
      }
    }

    // Calculate the total amount
    let totalAmount = 0;
    for (let item of cartItems) {
      totalAmount +=
        parseFloat(item.productId.price.toString()) * item.quantity;
    }

    // Create an Order with paymentStatus: "PENDING"
    const order = await Order.create({
      userId,
      totalAmount,
      paymentStatus: "PENDING",
      orderStatus: OrderStatus.PENDING,
      shippingAddressId,
    });
    await order.save({ session });

    // Create OrderItems linked to the order and update stock
    for (let item of cartItems) {
      const orderItem = new OrderItem({
        orderId: order._id,
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.productId.price,
      });
      await orderItem.save({ session });

      // Update stock
      await Product.findByIdAndUpdate(
        item.productId._id,
        { $inc: { stock: -item.quantity } },
        { session },
      );
    }

    // Use Stripe to create a payment intent

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: "usd",
      metadata: { orderId: order._id.toString() },
    });

    // Update order with payment intent ID
    order.paymentIntentId = paymentIntent.id;
    await order.save({ session });

    // Clear or update the cart status after order creation
    cart.status = CartStatus.ORDERED;
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

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
    session.endSession();
    console.log("Checkout error: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error during checkout",
      error: error.message,
    });
  }
}

// Retrieve orders for the authenticated user
async function getUserOrders(req, res) {
  try {
    const userId = req.user.id;
    const orders = await Order.findAll({
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
    const orders = await Order.findAll({
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
