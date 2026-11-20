const mongoose = require("mongoose");

const foodClaimSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodListing",
      required: true,
    },

    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipientOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    donorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    donorOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    beneficiariesTarget: {
      type: Number,
      required: true,
      min: 1,
    },

    pickupEta: {
      type: Date,
      required: true,
    },

    pickupNotes: {
      type: String,
      default: "",
    },

    handoverOtp: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "REQUESTED",
        "ACCEPTED",
        "PICKED_UP",
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "ACCEPTED",
    },

    pickedUpAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    completionNotes: {
      type: String,
      default: "",
    },

    impactSummary: {
      mealsDelivered: { type: Number, default: 0 },
      peopleFed: { type: Number, default: 0 },
      co2DivertedKg: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

foodClaimSchema.index({ recipientOrganization: 1, status: 1 });
foodClaimSchema.index({ donorOrganization: 1, status: 1 });
foodClaimSchema.index({ listing: 1 });

module.exports = mongoose.model("FoodClaim", foodClaimSchema);
