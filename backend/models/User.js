const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      select: false,
      default: undefined,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["donor", "ngo", "volunteer", "admin"],
      default: "donor",
    },

    authProviders: {
      type: [String],
      default: ["email"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);