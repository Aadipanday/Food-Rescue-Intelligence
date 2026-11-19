const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    // The food listing evaluated
    foodListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodListing",
      required: [true, "FoodListing reference is required"],
    },
    // The NGO organization suggested by the algorithm
    ngoOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "NGO Organization reference is required"],
    },
    // Match score calculated by system (0 to 100) based on distance, quantity & time urgency
    matchScore: {
      type: Number,
      required: [true, "Match score is required"],
      min: [0, "Match score cannot be less than 0"],
      max: [100, "Match score cannot be more than 100"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "accepted", "rejected"],
        message: "Status must be pending, accepted, or rejected",
      },
      default: "pending",
    },
  },
  { timestamps: true }
);

// Prevent duplicate match records for the same listing and NGO
matchSchema.index({ foodListing: 1, ngoOrganization: 1 }, { unique: true });

module.exports = mongoose.model("Match", matchSchema);
