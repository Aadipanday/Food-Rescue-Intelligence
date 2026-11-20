const FoodListing = require("../models/FoodListing");
const FoodClaim = require("../models/FoodClaim");
const Organization = require("../models/Organization");
const generateOtp = require("../utils/generateOtp");
const { analyzeFoodUrgencyAndSafety } = require("../services/aiService");

// 1. Create a food rescue listing (Food Providers / Donors)
const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      foodType,
      quantity,
      unit,
      cookedTime,
      expiryTime,
      storageCondition,
      pickupLocation,
      pickupWindow,
      contactPhone,
      notes,
      images,
    } = req.body;

    if (!title || !quantity || !expiryTime) {
      return res.status(400).json({
        success: false,
        message: "Title, quantity and expiryTime are required",
      });
    }

    // Resolve user's organization
    let organizationId = req.user.organization;
    if (!organizationId) {
      const org = await Organization.findOne({ owner: req.user._id });
      if (org) {
        organizationId = org._id;
        req.user.organization = org._id;
        await req.user.save();
      }
    }

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Please register your Organization (Food Provider) first before posting listings",
      });
    }

    // Default pickup location from organization if not fully provided
    const org = await Organization.findById(organizationId);
    const resolvedLocation = {
      street: pickupLocation?.street || org?.address?.street || "",
      city: pickupLocation?.city || org?.address?.city || "",
      state: pickupLocation?.state || org?.address?.state || "",
      pincode: pickupLocation?.pincode || org?.address?.pincode || "",
      latitude: pickupLocation?.latitude || org?.location?.latitude || 0,
      longitude: pickupLocation?.longitude || org?.location?.longitude || 0,
    };

    // Calculate AI urgency and environmental impact
    const aiAnalysis = analyzeFoodUrgencyAndSafety({
      category: category || "COOKED_MEALS",
      foodType: foodType || "VEG",
      quantity: Number(quantity),
      unit: unit || "MEALS",
      storageCondition: storageCondition || "ROOM_TEMPERATURE",
      expiryTime,
      cookedTime,
    });

    const listing = await FoodListing.create({
      title: title.trim(),
      description: description || "",
      category: category || "COOKED_MEALS",
      foodType: foodType || "VEG",
      quantity: Number(quantity),
      unit: unit || "MEALS",
      cookedTime: cookedTime || new Date(),
      expiryTime: new Date(expiryTime),
      storageCondition: storageCondition || "ROOM_TEMPERATURE",
      urgencyLevel: aiAnalysis.urgencyLevel,
      pickupLocation: resolvedLocation,
      pickupWindow: {
        startTime: pickupWindow?.startTime ? new Date(pickupWindow.startTime) : new Date(),
        endTime: pickupWindow?.endTime ? new Date(pickupWindow.endTime) : new Date(expiryTime),
      },
      contactPhone: contactPhone || req.user.phone || org?.phone || "",
      donor: req.user._id,
      organization: organizationId,
      status: "AVAILABLE",
      aiAnalysis: {
        urgencyScore: aiAnalysis.urgencyScore,
        estimatedMeals: aiAnalysis.estimatedMeals,
        co2eSavedKg: aiAnalysis.co2eSavedKg,
        waterSavedLiters: aiAnalysis.waterSavedLiters,
        shelfLifeRemainingHours: aiAnalysis.remainingHours,
        safetyRecommendation: aiAnalysis.safetyRecommendation,
        qualityScore: 90,
      },
      notes: notes || "",
      images: images || [],
    });

    return res.status(201).json({
      success: true,
      message: "Food rescue listing created successfully",
      listing,
    });
  } catch (error) {
    console.error("Create listing error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create food listing",
    });
  }
};

// 2. Get all food listings with filters
const getAllListings = async (req, res) => {
  try {
    const {
      status,
      category,
      foodType,
      city,
      urgencyLevel,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (status && status !== "ALL") {
      query.status = status;
    } else if (!status) {
      query.status = "AVAILABLE"; // Default to available listings
    }

    if (category) query.category = category;
    if (foodType) query.foodType = foodType;
    if (urgencyLevel) query.urgencyLevel = urgencyLevel;
    if (city) {
      query["pickupLocation.city"] = new RegExp(city.trim(), "i");
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search.trim(), "i") },
        { description: new RegExp(search.trim(), "i") },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const listings = await FoodListing.find(query)
      .populate("donor", "name email phone picture")
      .populate("organization", "name type address phone verificationStatus")
      .populate("claimedBy.organization", "name type phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await FoodListing.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: listings.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      listings,
    });
  } catch (error) {
    console.error("Get listings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch listings",
    });
  }
};

// 3. Get single listing by ID
const getListingById = async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.id)
      .populate("donor", "name email phone picture")
      .populate("organization", "name type address phone location verificationStatus")
      .populate("claimedBy.user", "name email phone")
      .populate("claimedBy.organization", "name type address phone");

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Food listing not found",
      });
    }

    return res.status(200).json({
      success: true,
      listing,
    });
  } catch (error) {
    console.error("Get listing by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch listing",
    });
  }
};

// 4. Get listings created by current user / organization
const getMyListings = async (req, res) => {
  try {
    const listings = await FoodListing.find({ donor: req.user._id })
      .populate("organization", "name type address phone")
      .populate("claimedBy.organization", "name type phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch (error) {
    console.error("Get my listings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your listings",
    });
  }
};

// 5. Update a listing (Donor only)
const updateListing = async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Food listing not found",
      });
    }

    if (String(listing.donor) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only update your own listings",
      });
    }

    if (listing.status !== "AVAILABLE") {
      return res.status(400).json({
        success: false,
        message: `Cannot update listing that is already ${listing.status}`,
      });
    }

    const updatable = [
      "title",
      "description",
      "category",
      "foodType",
      "quantity",
      "unit",
      "expiryTime",
      "storageCondition",
      "pickupLocation",
      "pickupWindow",
      "contactPhone",
      "notes",
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        listing[field] = req.body[field];
      }
    });

    // Re-run AI analysis if expiry or quantity changed
    if (req.body.expiryTime || req.body.quantity) {
      const aiAnalysis = analyzeFoodUrgencyAndSafety({
        category: listing.category,
        foodType: listing.foodType,
        quantity: listing.quantity,
        unit: listing.unit,
        storageCondition: listing.storageCondition,
        expiryTime: listing.expiryTime,
        cookedTime: listing.cookedTime,
      });

      listing.urgencyLevel = aiAnalysis.urgencyLevel;
      listing.aiAnalysis = {
        ...listing.aiAnalysis,
        urgencyScore: aiAnalysis.urgencyScore,
        estimatedMeals: aiAnalysis.estimatedMeals,
        co2eSavedKg: aiAnalysis.co2eSavedKg,
        waterSavedLiters: aiAnalysis.waterSavedLiters,
        shelfLifeRemainingHours: aiAnalysis.remainingHours,
        safetyRecommendation: aiAnalysis.safetyRecommendation,
      };
    }

    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      listing,
    });
  } catch (error) {
    console.error("Update listing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update listing",
    });
  }
};

// 6. Delete / Cancel a listing
const deleteListing = async (req, res) => {
  try {
    const listing = await FoodListing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Food listing not found",
      });
    }

    if (String(listing.donor) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own listings",
      });
    }

    listing.status = "CANCELLED";
    await listing.save();

    return res.status(200).json({
      success: true,
      message: "Listing cancelled successfully",
    });
  } catch (error) {
    console.error("Delete listing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel listing",
    });
  }
};

// 7. Claim a Food Listing (NGOs / Food Receivers)
const claimListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { beneficiariesTarget, pickupEta, pickupNotes } = req.body;

    const listing = await FoodListing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Food listing not found",
      });
    }

    if (listing.status !== "AVAILABLE") {
      return res.status(400).json({
        success: false,
        message: `This food listing is no longer available (Status: ${listing.status})`,
      });
    }

    // Resolve recipient's organization
    let recipientOrgId = req.user.organization;
    if (!recipientOrgId) {
      const org = await Organization.findOne({ owner: req.user._id });
      if (org) {
        recipientOrgId = org._id;
        req.user.organization = org._id;
        await req.user.save();
      }
    }

    if (!recipientOrgId) {
      return res.status(400).json({
        success: false,
        message: "You must register or belong to an NGO/Organization before claiming food",
      });
    }

    // Do not allow donor to claim their own listing
    if (String(listing.donor) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot claim your own food listing",
      });
    }

    // Generate 6-digit secure handover verification OTP
    const handoverOtp = generateOtp();
    const resolvedEta = pickupEta ? new Date(pickupEta) : new Date(Date.now() + 60 * 60 * 1000); // 1 hour default
    const resolvedTarget = Number(beneficiariesTarget) || listing.servingsEstimated || listing.quantity;

    // Update listing
    listing.status = "CLAIMED";
    listing.claimedBy = {
      user: req.user._id,
      organization: recipientOrgId,
      claimedAt: new Date(),
      pickupEta: resolvedEta,
      beneficiariesTarget: resolvedTarget,
    };
    listing.handoverOtp = handoverOtp;
    await listing.save();

    // Create Food Claim record
    const claim = await FoodClaim.create({
      listing: listing._id,
      recipientUser: req.user._id,
      recipientOrganization: recipientOrgId,
      donorUser: listing.donor,
      donorOrganization: listing.organization,
      beneficiariesTarget: resolvedTarget,
      pickupEta: resolvedEta,
      pickupNotes: pickupNotes || "",
      handoverOtp,
      status: "ACCEPTED",
    });

    return res.status(200).json({
      success: true,
      message: "Food listing claimed successfully! Share the handover code with the donor during pickup.",
      handoverOtp,
      claimId: claim._id,
      listing,
    });
  } catch (error) {
    console.error("Claim listing error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to claim listing",
    });
  }
};

// 8. Verify Handover via OTP (Called by Donor when NGO arrives)
const verifyHandover = async (req, res) => {
  try {
    const { id } = req.params;
    const { handoverOtp } = req.body;

    if (!handoverOtp) {
      return res.status(400).json({
        success: false,
        message: "Handover OTP is required",
      });
    }

    const listing = await FoodListing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Food listing not found",
      });
    }

    if (String(listing.donor) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only the food donor can verify the pickup handover",
      });
    }

    if (listing.status !== "CLAIMED") {
      return res.status(400).json({
        success: false,
        message: `Listing is not in CLAIMED state (Current status: ${listing.status})`,
      });
    }

    if (String(listing.handoverOtp).trim() !== String(handoverOtp).trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid handover OTP. Please verify with the recipient.",
      });
    }

    // Complete the rescue
    listing.status = "COMPLETED";
    await listing.save();

    // Update claim record
    const claim = await FoodClaim.findOne({ listing: listing._id, status: "ACCEPTED" });
    if (claim) {
      claim.status = "COMPLETED";
      claim.pickedUpAt = new Date();
      claim.completedAt = new Date();
      claim.impactSummary = {
        mealsDelivered: listing.aiAnalysis?.estimatedMeals || listing.quantity,
        peopleFed: listing.claimedBy?.beneficiariesTarget || listing.servingsEstimated || listing.quantity,
        co2DivertedKg: listing.aiAnalysis?.co2eSavedKg || 0,
      };
      await claim.save();
    }

    return res.status(200).json({
      success: true,
      message: "Handover verified successfully! Food rescue mission completed.",
      listing,
      impact: claim?.impactSummary || listing.aiAnalysis,
    });
  } catch (error) {
    console.error("Verify handover error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify handover",
    });
  }
};

module.exports = {
  createListing,
  getAllListings,
  getListingById,
  getMyListings,
  updateListing,
  deleteListing,
  claimListing,
  verifyHandover,
};
