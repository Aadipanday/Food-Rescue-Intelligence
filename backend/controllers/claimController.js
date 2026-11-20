const FoodClaim = require("../models/FoodClaim");
const FoodListing = require("../models/FoodListing");

// 1. Get claims made by current NGO / Receiver
const getMyClaims = async (req, res) => {
  try {
    const claims = await FoodClaim.find({ recipientUser: req.user._id })
      .populate("listing")
      .populate("donorOrganization", "name phone address")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: claims.length,
      claims,
    });
  } catch (error) {
    console.error("Get my claims error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch claims",
    });
  }
};

// 2. Get incoming claims for listings posted by this Food Provider
const getIncomingClaims = async (req, res) => {
  try {
    const claims = await FoodClaim.find({ donorUser: req.user._id })
      .populate("listing")
      .populate("recipientOrganization", "name phone address verificationStatus")
      .populate("recipientUser", "name phone email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: claims.length,
      claims,
    });
  } catch (error) {
    console.error("Get incoming claims error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch incoming claims",
    });
  }
};

// 3. Get single claim details
const getClaimById = async (req, res) => {
  try {
    const claim = await FoodClaim.findById(req.params.id)
      .populate("listing")
      .populate("recipientOrganization", "name phone address")
      .populate("donorOrganization", "name phone address")
      .populate("recipientUser", "name phone")
      .populate("donorUser", "name phone");

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    return res.status(200).json({
      success: true,
      claim,
    });
  } catch (error) {
    console.error("Get claim by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch claim",
    });
  }
};

// 4. Cancel a claim
const cancelClaim = async (req, res) => {
  try {
    const claim = await FoodClaim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    if (
      String(claim.recipientUser) !== String(req.user._id) &&
      String(claim.donorUser) !== String(req.user._id) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this claim",
      });
    }

    if (claim.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Completed rescues cannot be cancelled",
      });
    }

    claim.status = "CANCELLED";
    await claim.save();

    // Revert listing back to AVAILABLE
    await FoodListing.findByIdAndUpdate(claim.listing, {
      status: "AVAILABLE",
      claimedBy: null,
      handoverOtp: null,
    });

    return res.status(200).json({
      success: true,
      message: "Claim cancelled and food listing restored to AVAILABLE status",
    });
  } catch (error) {
    console.error("Cancel claim error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel claim",
    });
  }
};

module.exports = {
  getMyClaims,
  getIncomingClaims,
  getClaimById,
  cancelClaim,
};
