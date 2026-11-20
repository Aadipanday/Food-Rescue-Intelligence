const express = require("express");
const router = express.Router();

const {
  analyzeFood,
  getRecommendationsForListing,
  calculateImpact,
} = require("../controllers/aiController");

const { protect } = require("../middleware/authMiddleware");

// AI Analysis endpoints
router.post("/analyze", analyzeFood);
router.post("/impact", calculateImpact);
router.get("/recommend-ngos/:listingId", protect, getRecommendationsForListing);

module.exports = router;
