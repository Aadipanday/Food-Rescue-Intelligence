const express = require("express");
const router = express.Router();

const {
  analyzeFood,
  getRecommendationsForListing,
  calculateImpact,
  scanFoodImage,
  parseFoodPrompt,
} = require("../controllers/aiController");

const { protect } = require("../middleware/authMiddleware");

// AI Analysis endpoints
router.post("/analyze", analyzeFood);
router.post("/impact", calculateImpact);
router.post("/scan-image", scanFoodImage);
router.post("/parse-prompt", parseFoodPrompt);
router.get("/recommend-ngos/:listingId", protect, getRecommendationsForListing);

module.exports = router;
