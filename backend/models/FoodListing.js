const mongoose = require("mongoose");

const foodListingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: String,
      enum: [
        "COOKED_MEALS",
        "RAW_GROCERY",
        "BAKERY",
        "PACKAGED_FOOD",
        "DAIRY",
        "FRUITS_VEGETABLES",
        "BEVERAGES",
        "OTHER",
      ],
      default: "COOKED_MEALS",
      required: true,
    },

    foodType: {
      type: String,
      enum: ["VEG", "NON_VEG", "VEGAN"],
      default: "VEG",
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unit: {
      type: String,
      enum: ["MEALS", "KG", "PACKETS", "BOXES", "LITERS", "PORTIONS"],
      default: "MEALS",
    },

    servingsEstimated: {
      type: Number,
      default: function () {
        if (this.unit === "MEALS" || this.unit === "PORTIONS") {
          return this.quantity;
        }
        if (this.unit === "KG") {
          return Math.round(this.quantity / 0.4); // ~400g per meal
        }
        return this.quantity;
      },
    },

    cookedTime: {
      type: Date,
      default: Date.now,
    },

    expiryTime: {
      type: Date,
      required: true,
    },

    storageCondition: {
      type: String,
      enum: ["ROOM_TEMPERATURE", "REFRIGERATED", "FROZEN", "HEATED"],
      default: "ROOM_TEMPERATURE",
    },

    urgencyLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },

    pickupLocation: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
    },

    pickupWindow: {
      startTime: { type: Date, default: Date.now },
      endTime: { type: Date, required: true },
    },

    contactPhone: {
      type: String,
      default: "",
    },

    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "AVAILABLE",
        "CLAIMED",
        "PICKED_UP",
        "COMPLETED",
        "EXPIRED",
        "CANCELLED",
      ],
      default: "AVAILABLE",
    },

    claimedBy: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        default: null,
      },
      claimedAt: { type: Date, default: null },
      pickupEta: { type: Date, default: null },
      beneficiariesTarget: { type: Number, default: 0 },
    },

    handoverOtp: {
      type: String,
      default: null,
    },

    aiAnalysis: {
      urgencyScore: { type: Number, default: 50 }, // 0 - 100
      estimatedMeals: { type: Number, default: 0 },
      co2eSavedKg: { type: Number, default: 0 },
      waterSavedLiters: { type: Number, default: 0 },
      shelfLifeRemainingHours: { type: Number, default: 0 },
      safetyRecommendation: { type: String, default: "" },
      qualityScore: { type: Number, default: 85 },
    },

    images: [String],
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Indexes for fast searching and geospatial filtering
foodListingSchema.index({ status: 1, expiryTime: 1 });
foodListingSchema.index({ organization: 1 });
foodListingSchema.index({ "pickupLocation.city": 1 });
foodListingSchema.index({ "pickupLocation.latitude": 1, "pickupLocation.longitude": 1 });

module.exports = mongoose.model("FoodListing", foodListingSchema);
