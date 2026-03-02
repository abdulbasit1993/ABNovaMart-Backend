import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
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
    collection: "cart_items",
  },
);

cartItemSchema.index({ cartId: 1, productId: 1 }, { unique: true });

export const CartItem = mongoose.model("CartItem", cartItemSchema);
