import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    description: { type: String },
    sku: { type: String, unique: true, required: true },
    stock: { type: Number, default: 0 },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    images: [String],
    isActive: { type: Boolean, default: true },
    tags: [String],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "products",
  },
);

export const Product = mongoose.model("Product", productSchema);
