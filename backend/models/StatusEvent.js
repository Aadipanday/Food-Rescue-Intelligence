const mongoose = require("mongoose");

const statusEventSchema = new mongoose.Schema(
  {
    // The listing whose status transitioned
    foodListing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodListing",
      required: [true, "FoodListing reference is required"],
    },
    oldStatus: {
      type: String,
      required: [true, "oldStatus is required"],
    },
    newStatus: {
      type: String,
      required: [true, "newStatus is required"],
      validate: {
        validator: function (value) {
          // New status must be distinct from old status
          return value !== this.oldStatus;
        },
        message: "newStatus must be different from oldStatus",
      },
    },
    // The actor who triggered this status transition (User ID)
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "changedBy (User reference) is required"],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Index for chronological timeline retrieval of a food listing
statusEventSchema.index({ foodListing: 1, changedAt: 1 });

module.exports = mongoose.model("StatusEvent", statusEventSchema);
