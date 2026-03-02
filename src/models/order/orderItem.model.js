import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
  },
  {
    collection: "order_items",
  },
);

orderItemSchema.index({ orderId: 1, productId: 1 }, { unique: true });
export const OrderItem = mongoose.model("OrderItem", orderItemSchema);
