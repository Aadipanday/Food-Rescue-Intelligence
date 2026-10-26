
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, default: null },
    phone: { type: String, default: null },

    // Registration email verification
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },

    // Hashed OTP and its purpose: register or login
    emailOtp: { type: String, default: null },
    emailOtpExpires: { type: Date, default: null },
    emailOtpPurpose: {
      type: String,
      enum: ["register", "login", null],
      default: null,
    },

    // Phone verification / login OTP
    isPhoneVerified: { type: Boolean, default: false },
    phoneOtp: { type: String, default: null },
    phoneOtpExpires: { type: Date, default: null },

    // Google account
    googleId: { type: String, default: null },
    picture: { type: String, default: null },

    // Password reset
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
