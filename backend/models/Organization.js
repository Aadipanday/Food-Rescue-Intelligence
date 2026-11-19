const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    // Foreign key to User account (1 User = 1 Organization)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Linked user ID is required"],
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ["donor", "ngo"],
        message: "Organization type must be either 'donor' or 'ngo'",
      },
      required: [true, "Organization type is required"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    // Coordinates [longitude, latitude] for proximity distance calculations
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
    contactPhone: {
      type: String,
      trim: true,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 2dsphere index enables MongoDB $near and $geoNear distance calculations
organizationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Organization", organizationSchema);
