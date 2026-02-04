import mongoose from "mongoose";
import { Roles } from "./user.enums.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Roles,
      default: "USER",
    },
    firstName: String,
    lastName: String,
    phone: String,
    isVerified: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "users",
  },
);

export const User = mongoose.model("User", userSchema);
