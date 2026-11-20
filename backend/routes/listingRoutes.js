const express = require("express");
const router = express.Router();

const {
  createListing,
  getAllListings,
  getListingById,
  getMyListings,
  updateListing,
  deleteListing,
  claimListing,
  verifyHandover,
} = require("../controllers/listingController");

const { protect } = require("../middleware/authMiddleware");

// Public / Authenticated listings browsing
router.get("/", getAllListings);
router.get("/my", protect, getMyListings);
router.get("/:id", getListingById);

// Provider listing management
router.post("/", protect, createListing);
router.put("/:id", protect, updateListing);
router.delete("/:id", protect, deleteListing);

// Rescue & Handover workflow
router.post("/:id/claim", protect, claimListing);
router.post("/:id/verify-handover", protect, verifyHandover);

module.exports = router;
