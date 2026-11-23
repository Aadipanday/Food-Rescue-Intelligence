const express = require("express");
const router = express.Router();

const {
  getMyClaims,
  getIncomingClaims,
  getClaimById,
  cancelClaim,
  trackClaim,
  updateClaimStatus,
} = require("../controllers/claimController");
const { verifyHandover } = require("../controllers/listingController");

const { protect, optionalAuth } = require("../middleware/authMiddleware");

// Public / Authenticated tracking endpoint
router.get("/track/:id", optionalAuth, trackClaim);

// Protected claim management
router.get("/my", protect, getMyClaims);
router.get("/incoming", protect, getIncomingClaims);
router.get("/:id", protect, getClaimById);
router.patch("/:id/status", protect, updateClaimStatus);
router.post("/:id/cancel", protect, cancelClaim);
router.post("/:id/verify-handover", protect, verifyHandover);

module.exports = router;
