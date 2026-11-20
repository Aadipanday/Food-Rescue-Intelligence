const FoodListing = require("../models/FoodListing");
const Organization = require("../models/Organization");
const {
  analyzeFoodUrgencyAndSafety,
  calculateFoodImpact,
  matchListingWithNgos,
} = require("../services/aiService");

// 1. Analyze food urgency and safety recommendations
const analyzeFood = async (req, res) => {
  try {
    const {
      category,
      foodType,
      quantity,
      unit,
      storageCondition,
      expiryTime,
      cookedTime,
    } = req.body;

    if (!expiryTime) {
      return res.status(400).json({
        success: false,
        message: "expiryTime is required for AI safety & urgency analysis",
      });
    }

    const analysis = analyzeFoodUrgencyAndSafety({
      category: category || "COOKED_MEALS",
      foodType: foodType || "VEG",
      quantity: quantity || 1,
      unit: unit || "MEALS",
      storageCondition: storageCondition || "ROOM_TEMPERATURE",
      expiryTime,
      cookedTime,
    });

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("AI analyzeFood error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to run AI food analysis",
    });
  }
};

// 2. Recommend best matched NGOs for a listing
const getRecommendationsForListing = async (req, res) => {
  try {
    const { listingId } = req.params;

    const listing = await FoodListing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Food listing not found",
      });
    }

    // Find all active/approved NGOs
    const ngos = await Organization.find({
      type: "NGO",
      verificationStatus: { $in: ["APPROVED", "PENDING"] },
    });

    const recommendations = matchListingWithNgos(listing, ngos);

    return res.status(200).json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error("AI recommendations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate NGO recommendations",
    });
  }
};

// 3. Calculate environmental impact directly
const calculateImpact = async (req, res) => {
  try {
    const { quantity, unit, category } = req.body;

    if (!quantity || !unit) {
      return res.status(400).json({
        success: false,
        message: "Quantity and unit are required",
      });
    }

    const impact = calculateFoodImpact({ quantity, unit, category });

    return res.status(200).json({
      success: true,
      impact,
    });
  } catch (error) {
    console.error("AI impact error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate impact",
    });
  }
};

module.exports = {
  analyzeFood,
  getRecommendationsForListing,
  calculateImpact,
};
