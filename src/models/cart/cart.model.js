import mongoose from "mongoose";
import { CartStatus } from "./cart.enums.js";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    status: { type: String, enum: CartStatus, default: "ACTIVE" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "carts",
  },
);

export const Cart = mongoose.model("Cart", cartSchema);
