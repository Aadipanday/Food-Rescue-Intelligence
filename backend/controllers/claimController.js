const FoodClaim = require("../models/FoodClaim");
const FoodListing = require("../models/FoodListing");
const {
  emitRescueAccepted,
  emitVanDispatched,
  emitRescueStatusUpdated,
  emitRescueCancelled,
} = require("../services/socketService");

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

// 4. Cancel or Reject a claim
const cancelClaim = async (req, res) => {
  try {
    const { id } = req.params;
    let claim = null;

    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      claim = await FoodClaim.findById(id);
      if (!claim) {
        claim = await FoodClaim.findOne({ listing: id });
      }
    }

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    // Check authorization: Donor, Recipient, or Admin
    const isRecipient =
      String(claim.recipientUser) === String(req.user._id) ||
      (req.user.organization && String(claim.recipientOrganization) === String(req.user.organization)) ||
      ["ngo", "recipient"].includes(req.user.role?.toLowerCase());

    const isDonor =
      String(claim.donorUser) === String(req.user._id) ||
      (req.user.organization && String(claim.donorOrganization) === String(req.user.organization)) ||
      ["donor", "food_provider"].includes(req.user.role?.toLowerCase());

    const isAdmin = req.user.role === "admin";

    if (!isRecipient && !isDonor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel or decline this rescue request",
      });
    }

    if (claim.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Completed rescues cannot be cancelled",
      });
    }

    const isReject = req.body.action === "REJECT" || req.body.action === "DECLINE";
    claim.status = isReject ? "REJECTED" : "CANCELLED";
    if (req.body.reason) {
      claim.completionNotes = `Reason: ${req.body.reason}`;
    }
    await claim.save();

    // Revert listing back to AVAILABLE so other NGOs can claim it!
    const revertedListing = await FoodListing.findByIdAndUpdate(
      claim.listing,
      {
        status: "AVAILABLE",
        claimedBy: null,
        handoverOtp: null,
      },
      { new: true }
    );

    // Emit real-time cancellation / decline event
    emitRescueCancelled(claim, revertedListing || { _id: claim.listing });

    return res.status(200).json({
      success: true,
      message: isReject
        ? "Rescue request declined. Food listing restored to available mesh."
        : "Rescue claim cancelled and food listing restored to available mesh.",
      claim,
    });
  } catch (error) {
    console.error("Cancel claim error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel claim",
    });
  }
};

// 5. Track Claim (by Claim ID or Food Listing ID)
const trackClaim = async (req, res) => {
  try {
    const { id } = req.params;
    let claim = null;

    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      claim = await FoodClaim.findById(id)
        .populate("listing")
        .populate("recipientOrganization", "name phone address verificationStatus")
        .populate("donorOrganization", "name phone address")
        .populate("recipientUser", "name phone email")
        .populate("donorUser", "name phone email");

      if (!claim) {
        // Try finding active claim by listing ID
        claim = await FoodClaim.findOne({ listing: id, status: { $nin: ["CANCELLED", "REJECTED"] } })
          .populate("listing")
          .populate("recipientOrganization", "name phone address verificationStatus")
          .populate("donorOrganization", "name phone address")
          .populate("recipientUser", "name phone email")
          .populate("donorUser", "name phone email")
          .sort({ createdAt: -1 });

        if (!claim) {
          // If no active claim, fetch latest claim (e.g. cancelled/completed)
          claim = await FoodClaim.findOne({ listing: id })
            .populate("listing")
            .populate("recipientOrganization", "name phone address verificationStatus")
            .populate("donorOrganization", "name phone address")
            .populate("recipientUser", "name phone email")
            .populate("donorUser", "name phone email")
            .sort({ createdAt: -1 });
        }
      }
    }

    if (!claim) {
      // Check if it's a FoodListing (e.g. freshly posted donation, status: AVAILABLE or awaiting pickup)
      if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
        const listing = await FoodListing.findById(id)
          .populate("donor", "name phone email")
          .populate("organization", "name phone address location")
          .populate("claimedBy.organization", "name phone address")
          .populate("claimedBy.user", "name phone email");

        if (listing) {
          const isDonor = req.user ? String(listing.donor?._id || listing.donor) === String(req.user._id) : false;
          return res.status(200).json({
            success: true,
            isListingOnly: true,
            listing,
            status: listing.status,
            isDonor,
          });
        }
      }

      return res.status(404).json({
        success: false,
        message: "No active rescue record or food donation found for this tracking code or ID",
      });
    }

    const isDonor = req.user ? String(claim.donorUser?._id || claim.donorUser) === String(req.user._id) : false;
    const isRecipient = req.user ? String(claim.recipientUser?._id || claim.recipientUser) === String(req.user._id) : false;

    return res.status(200).json({
      success: true,
      isListingOnly: false,
      claim,
      status: claim.status,
      isDonor,
      isRecipient,
    });
  } catch (error) {
    console.error("Track claim error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve tracking details",
    });
  }
};

// 6. Update Claim Live Status (e.g., IN_TRANSIT, PICKED_UP, etc.)
const updateClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, pickupNotes } = req.body;

    const validStatuses = ["REQUESTED", "ACCEPTED", "IN_TRANSIT", "PICKED_UP", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    let claim = null;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      claim = await FoodClaim.findById(id);
      if (!claim) {
        // Support updating by listing ID as well
        claim = await FoodClaim.findOne({ listing: id });
      }
    }

    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found" });
    }

    // Authorization check
    const isRecipient =
      String(claim.recipientUser) === String(req.user._id) ||
      (req.user.organization && String(claim.recipientOrganization) === String(req.user.organization)) ||
      ["ngo", "recipient"].includes(req.user.role?.toLowerCase());

    const isDonor =
      String(claim.donorUser) === String(req.user._id) ||
      (req.user.organization && String(claim.donorOrganization) === String(req.user.organization)) ||
      ["donor", "food_provider"].includes(req.user.role?.toLowerCase());

    const isAdmin = req.user.role === "admin";

    if (!isRecipient && !isDonor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this rescue status",
      });
    }

    // Ensure pickup van cannot be dispatched until donor accepts the request
    if (status === "IN_TRANSIT" && claim.status === "REQUESTED") {
      return res.status(400).json({
        success: false,
        message: "You cannot dispatch a pickup van until the food donor has accepted your rescue request.",
      });
    }

    claim.status = status;
    if (pickupNotes) claim.pickupNotes = pickupNotes;
    if (status === "PICKED_UP" && !claim.pickedUpAt) claim.pickedUpAt = new Date();
    if (status === "COMPLETED" && !claim.completedAt) claim.completedAt = new Date();
    await claim.save();

    // Also sync listing status
    let updatedListing = null;
    if (["IN_TRANSIT", "PICKED_UP", "COMPLETED", "CANCELLED"].includes(status)) {
      updatedListing = await FoodListing.findByIdAndUpdate(claim.listing, { status }, { new: true });
    }

    // Real-time WebSocket emission for instantaneous state transition
    if (status === "ACCEPTED") {
      emitRescueAccepted(claim, updatedListing || { _id: claim.listing });
    } else if (status === "IN_TRANSIT") {
      emitVanDispatched(claim, updatedListing || { _id: claim.listing });
    } else {
      emitRescueStatusUpdated(claim, updatedListing || { _id: claim.listing }, status);
    }

    return res.status(200).json({
      success: true,
      message: `Rescue status updated to ${status}`,
      claim,
    });
  } catch (error) {
    console.error("Update claim status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update rescue status",
    });
  }
};

module.exports = {
  getMyClaims,
  getIncomingClaims,
  getClaimById,
  cancelClaim,
  trackClaim,
  updateClaimStatus,
};
