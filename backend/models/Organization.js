const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["NGO", "FOOD_PROVIDER"],
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },

    location: {
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
    },

    phone: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    capacityPerDay: {
      type: Number,
      default: 100, // Number of meals NGO can handle / food provider can provide per day
    },

    operatingHours: {
      open: { type: String, default: "09:00" },
      close: { type: String, default: "21:00" },
    },

    verificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    verificationNote: {
      type: String,
      default: "",
    },

    documents: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", organizationSchema);
