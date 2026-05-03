require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

// Stripe webhook endpoint (Must be defined before express.json() middleware)
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      console.error("Webhook signature verification failed: ", error.message);
      return res.status(400).send("Webhook Error: " + error.message);
    }

    console.log("Webhook received: ", event.type);

    // Handle the event
    try {
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;

        const orderId = paymentIntent.metadata.orderId;

        console.log("Payment success for order: ", orderId);

        const { Order } = require("./src/models");

        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: "PAID",
          orderStatus: "PROCESSING",
        });
      }

      if (event.type === "payment_intent.payment_failed") {
        const paymentIntent = event.data.object;

        const orderId = paymentIntent.metadata.orderId;

        console.log("Payment failed for order: ", orderId);

        const { Order } = require("./src/models");

        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: "FAILED",
        });
      }

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook handler error: ", err);
      res.status(500).json({ error: "Webhook handler failed" });
    }
  },
);

app.use(express.json());
app.use(
  cors({
    origin: "*",
  }),
);

app.get("/api", (req, res) => {
  res.status(200).json({
    message: "Welcome to ABNovaMart APIs!",
  });
});

// Swagger API Documentation
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/auth", require("./src/routes/auth.routes"));

app.use("/api/user", require("./src/routes/user.routes"));

app.use("/api/product-categories", require("./src/routes/category.routes"));

app.use("/api/products", require("./src/routes/product.routes"));

app.use("/api/cart", require("./src/routes/cart.routes"));

app.use("/api/orders", require("./src/routes/order.routes"));

app.use("/api/addresses", require("./src/routes/address.routes"));

require("./src/config/db")();

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

module.exports = app;
