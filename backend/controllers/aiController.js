const FoodListing = require("../models/FoodListing");
const Organization = require("../models/Organization");
const {
  analyzeFoodUrgencyAndSafety,
  calculateFoodImpact,
  matchListingWithNgos,
  analyzeFoodImageWithGemini,
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

// 4. Scan food image with Gemini Multimodal Vision API
const scanFoodImage = async (req, res) => {
  try {
    const { image, mimeType } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image data (base64 string) is required for AI vision analysis",
      });
    }

    const analysis = await analyzeFoodImageWithGemini({
      imageBase64: image,
      mimeType: mimeType || "image/jpeg",
    });

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("AI scanFoodImage error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to analyze food image with Gemini AI",
    });
  }
};

// 5. Parse natural language conversational food prompt (Hinglish/English)
const parseFoodPrompt = async (req, res) => {
  try {
    const { promptText } = req.body;

    if (!promptText || !promptText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt text is required (e.g. '5 kg daal aur 10kg chawal bache hai room me rakhe hai 1 ghante pehle bne the')",
      });
    }

    const { parseFoodPromptWithGemini } = require("../services/aiService");
    const extractedData = await parseFoodPromptWithGemini({ promptText });

    return res.status(200).json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error("AI parseFoodPrompt error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to parse natural language food prompt",
    });
  }
};

module.exports = {
  analyzeFood,
  getRecommendationsForListing,
  calculateImpact,
  scanFoodImage,
  parseFoodPrompt,
};
