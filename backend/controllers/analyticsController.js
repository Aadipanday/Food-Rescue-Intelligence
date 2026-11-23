const FoodListing = require("../models/FoodListing");
const FoodClaim = require("../models/FoodClaim");
const Organization = require("../models/Organization");

// 1. Get platform-wide real-time rescue statistics
const getPlatformImpact = async (req, res) => {
  try {
    const totalListings = await FoodListing.countDocuments();
    const activeListings = await FoodListing.countDocuments({ status: "AVAILABLE" });
    const completedRescues = await FoodListing.countDocuments({ status: "COMPLETED" });

    const totalNgos = await Organization.countDocuments({ type: "NGO" });
    const totalProviders = await Organization.countDocuments({ type: "FOOD_PROVIDER" });

    // Aggregate completed rescues impact
    const impactAggregation = await FoodListing.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $group: {
          _id: null,
          totalMeals: {
            $sum: {
              $ifNull: ["$aiAnalysis.estimatedMeals", "$quantity"],
            },
          },
          totalCo2eSavedKg: {
            $sum: {
              $ifNull: ["$aiAnalysis.co2eSavedKg", 0],
            },
          },
          totalWaterSavedLiters: {
            $sum: {
              $ifNull: ["$aiAnalysis.waterSavedLiters", 0],
            },
          },
        },
      },
    ]);

    const stats = impactAggregation[0] || {
      totalMeals: 0,
      totalCo2eSavedKg: 0,
      totalWaterSavedLiters: 0,
    };

    const impactData = {
      totalMealsRescued: stats.totalMeals,
      totalKgSaved: Math.round(stats.totalMeals * 0.4),
      totalCo2SavedKg: Math.round(stats.totalCo2eSavedKg * 10) / 10,
      totalCo2eSavedKg: Math.round(stats.totalCo2eSavedKg * 10) / 10,
      totalCo2eSavedTonnes: Math.round((stats.totalCo2eSavedKg / 1000) * 100) / 100,
      totalWaterSavedLiters: Math.round(stats.totalWaterSavedLiters),
      completedRescuesCount: completedRescues,
      activeListingsCount: activeListings,
      totalListingsCount: totalListings,
      registeredNgosCount: totalNgos,
      registeredFoodProvidersCount: totalProviders,
    };

    return res.status(200).json({
      success: true,
      impact: impactData,
      data: impactData,
    });
  } catch (error) {
    console.error("Platform impact error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch platform impact statistics",
    });
  }
};

// 2. Get user / organization personal impact
const getUserImpact = async (req, res) => {
  try {
    const userRole = (req.user.role || "").toUpperCase();
    const isProvider = userRole === "FOOD_PROVIDER" || userRole === "DONOR";

    const matchQuery = isProvider
      ? { donor: req.user._id, status: "COMPLETED" }
      : { "claimedBy.user": req.user._id, status: "COMPLETED" };

    const completed = await FoodListing.find(matchQuery);

    let totalMeals = 0;
    let totalCo2eSavedKg = 0;
    let totalWaterSavedLiters = 0;

    completed.forEach((listing) => {
      totalMeals += listing.aiAnalysis?.estimatedMeals || listing.quantity || 0;
      totalCo2eSavedKg += listing.aiAnalysis?.co2eSavedKg || 0;
      totalWaterSavedLiters += listing.aiAnalysis?.waterSavedLiters || 0;
    });

    const impactStats = {
      role: req.user.role,
      completedRescues: completed.length,
      totalMealsFed: totalMeals,
      totalMealsRescued: totalMeals,
      totalCo2eSavedKg: Math.round(totalCo2eSavedKg * 10) / 10,
      totalWaterSavedLiters: Math.round(totalWaterSavedLiters),
    };

    return res.status(200).json({
      success: true,
      personalImpact: impactStats,
      impact: impactStats,
      data: impactStats,
    });
  } catch (error) {
    console.error("User impact error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch personal impact statistics",
    });
  }
};

module.exports = {
  getPlatformImpact,
  getUserImpact,
};
