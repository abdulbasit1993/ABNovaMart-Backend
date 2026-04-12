import mongoose from "mongoose";
import { OrderStatus, PaymentStatus } from "./order.enums.js";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalAmount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: PaymentStatus,
      default: "PENDING",
    },
    paymentIntentId: {
      type: String,
    },
    orderStatus: {
      type: String,
      enum: OrderStatus,
      default: "PENDING",
    },
    shippingAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "orders",
  },
);

export const Order = mongoose.model("Order", orderSchema);
