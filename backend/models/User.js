
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

    // Core Role: determines capabilities across the platform
    role: {
      type: String,
      enum: ["donor", "ngo", "volunteer", "admin"],
      default: "donor",
    },

    // Reference to Organization document (if donor or ngo)
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },

    // Organization / Business Profile (for Donors and NGOs)
    organization: {
      name: { type: String, default: null, trim: true },
      regNumber: { type: String, default: null, trim: true }, // FSSAI / NGO Darpan / Society Reg
      orgType: {
        type: String,
        enum: [
          "restaurant",
          "hotel",
          "caterer",
          "hostel",
          "supermarket",
          "ngo",
          "shelter_home",
          "individual",
          "other",
        ],
        default: "individual",
      },
    },

    // Volunteer specific information
    volunteerDetails: {
      vehicleType: {
        type: String,
        enum: ["bike", "car", "van", "foot", "none"],
        default: "none",
      },
      isAvailable: { type: Boolean, default: true },
    },

    // Physical Address
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },

    // GeoJSON point for geospatial proximity matching ($near / $geoNear)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    // Trust & Verification
    isVerifiedOrg: { type: Boolean, default: false }, // Verified by admin

    // Impact Metrics & Gamification
    impact: {
      donationsCount: { type: Number, default: 0 },
      mealsRescued: { type: Number, default: 0 },
      deliveriesCompleted: { type: Number, default: 0 },
    },

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

// 2dsphere index for radius-based proximity searches
userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
