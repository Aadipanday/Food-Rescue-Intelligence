const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Basic user details
    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: [
        "user",
        "admin",
        "food_provider",
        "ngo",
        "FOOD_PROVIDER",
        "NGO",
        "ADMIN",
        "USER",
        "donor",
        "recipient",
        "volunteer",
      ],
      default: "user",
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
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
      default: null,
    },

    phone: {
      type: String,
      default: null,
    },

    // Email verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: null,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
    },

    // Email OTP (Registration + Login)
    emailOtp: {
      type: String,
      default: null,
    },

    emailOtpExpires: {
      type: Date,
      default: null,
    },

    emailOtpPurpose: {
      type: String,
      enum: ["register", "login", null],
      default: null,
    },

    // Phone verification / Login OTP
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    phoneOtp: {
      type: String,
      default: null,
    },

    phoneOtpExpires: {
      type: Date,
      default: null,
    },

    // Google Authentication
    googleId: {
      type: String,
    },

    picture: {
      type: String,
      default: null,
    },

    // Password Reset
    passwordResetToken: {
      type: String,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique Google ID only when a Google ID exists
userSchema.index(
  { googleId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      googleId: { $type: "string" },
    },
  }
);

module.exports = mongoose.model("User", userSchema);
