import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "categories",
  },
);

export const Category = mongoose.model("Category", categorySchema);
