const Organization = require("../models/Organization");
const User = require("../models/User");

// 1. Register NGO / Food Provider
const registerOrganization = async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      address,
      location,
      phone,
      email,
      website,
      capacityPerDay,
      operatingHours,
      documents,
    } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: "Organization name and type are required",
      });
    }

    const normalizedType = String(type).toUpperCase().trim();

    if (!["NGO", "FOOD_PROVIDER"].includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid organization type. Must be 'NGO' or 'FOOD_PROVIDER'",
      });
    }

    // Check whether user already has an organization
    const existingOrganization = await Organization.findOne({
      owner: req.user._id,
    });

    if (existingOrganization) {
      return res.status(409).json({
        success: false,
        message: "You already have a registered organization",
        organization: existingOrganization,
      });
    }

    const organization = await Organization.create({
      name: name.trim(),
      type: normalizedType,
      owner: req.user._id,
      description: description || "",
      address: address || {},
      location: location || { latitude: 0, longitude: 0 },
      phone: phone || req.user.phone || "",
      email: email || req.user.email || "",
      website: website || "",
      capacityPerDay: Number(capacityPerDay) || 100,
      operatingHours: operatingHours || { open: "09:00", close: "21:00" },
      documents: documents || [],
      verificationStatus: "PENDING",
    });

    // Link organization to the user and set their role
    await User.findByIdAndUpdate(req.user._id, {
      organization: organization._id,
      role: normalizedType,
    });

    return res.status(201).json({
      success: true,
      message: "Organization registered successfully. Submitted for verification.",
      organization,
    });
  } catch (error) {
    console.error("Register organization error:", error);
    return res.status(500).json({
      success: false,
      message: "Organization registration failed",
    });
  }
};

// 2. Get logged-in user's organization
const getMyOrganization = async (req, res) => {
  try {
    const organization = await Organization.findOne({
      owner: req.user._id,
    }).populate("owner", "name email phone picture");

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Get organization error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch organization",
    });
  }
};

// 3. Update organization details
const updateOrganization = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "description",
      "address",
      "location",
      "phone",
      "email",
      "website",
      "capacityPerDay",
      "operatingHours",
      "documents",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const organization = await Organization.findOneAndUpdate(
      { owner: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      organization,
    });
  } catch (error) {
    console.error("Update organization error:", error);
    return res.status(500).json({
      success: false,
      message: "Organization update failed",
    });
  }
};

// 4. Get public organizations list (filtered by type, city, etc.)
const getAllOrganizations = async (req, res) => {
  try {
    const { type, city, status = "APPROVED" } = req.query;

    const query = {};
    if (type) query.type = type.toUpperCase();
    if (city) query["address.city"] = new RegExp(city.trim(), "i");
    if (status && status !== "ALL") query.verificationStatus = status;

    const organizations = await Organization.find(query)
      .select("-documents")
      .populate("owner", "name email");

    return res.status(200).json({
      success: true,
      count: organizations.length,
      organizations,
    });
  } catch (error) {
    console.error("Get all organizations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch organizations",
    });
  }
};

// 5. Get organization by ID
const getOrganizationById = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id).populate(
      "owner",
      "name email phone picture"
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    return res.status(200).json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error("Get organization by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch organization details",
    });
  }
};

module.exports = {
  registerOrganization,
  getMyOrganization,
  updateOrganization,
  getAllOrganizations,
  getOrganizationById,
};
