const mongoose = require("mongoose");

const foodListingSchema = new mongoose.Schema(
  {
    // The organization donating the food
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization reference is required"],
    },
    // The donor user who created the listing
    donorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Donor User reference is required"],
    },
    foodName: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
    },
    // Dietary category (crucial for shelter matching)
    dietaryType: {
      type: String,
      enum: {
        values: ["veg", "non_veg", "vegan"],
        message: "dietaryType must be 'veg', 'non_veg', or 'vegan'",
      },
      default: "veg",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.1, "Quantity must be greater than 0"],
    },
    unit: {
      type: String,
      enum: {
        values: ["kg", "meals"],
        message: "Unit must be either 'kg' or 'meals'",
      },
      required: [true, "Unit is required"],
    },
    preparedAt: {
      type: Date,
      required: [true, "Preparation time is required"],
    },
    pickupDeadline: {
      type: Date,
      required: [true, "Pickup deadline is required"],
      validate: {
        validator: function (value) {
          // Deadline must be after preparation time
          return !this.preparedAt || value > this.preparedAt;
        },
        message: "Pickup deadline must be after preparation time",
      },
    },
    storageNotes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: [
          "available",
          "reserved",
          "picked_up",
          "delivered",
          "expired",
          "cancelled",
        ],
        message: "Invalid status value",
      },
      default: "available",
    },
  },
  { timestamps: true }
);

// Indexes for fast feed browsing and expiry checks
foodListingSchema.index({ status: 1, pickupDeadline: 1 });
foodListingSchema.index({ organization: 1 });

module.exports = mongoose.model("FoodListing", foodListingSchema);
