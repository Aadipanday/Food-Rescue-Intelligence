const mongoose = require("mongoose");

const donationRequestSchema = new mongoose.Schema(
  {
    // The food listing requested
    foodListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodListing",
      required: [true, "FoodListing reference is required"],
    },
    // The NGO organization requesting the food
    ngoOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "NGO Organization reference is required"],
    },
    // The specific user representing the NGO
    ngoUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "NGO User reference is required"],
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected", "cancelled"],
        message: "Status must be pending, approved, rejected, or cancelled",
      },
      default: "pending",
    },
    // Secure 4-6 digit OTP generated when approved, verified at physical pickup
    pickupOtp: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent an NGO from submitting multiple pending requests for the same food listing
donationRequestSchema.index({ foodListing: 1, ngoOrganization: 1, status: 1 });

module.exports = mongoose.model("DonationRequest", donationRequestSchema);
