const { Organization, User } = require("../models");

// @desc    Register a new organization (Canteen / Restaurant / NGO)
// @route   POST /api/organizations
// @access  Private (Logged-in User)
const createOrganization = async (req, res) => {
  try {
    const { name, type, address, city, contactPhone, coordinates } = req.body;

    if (!name?.trim() || !type || !address?.trim() || !city?.trim()) {
      return res.status(400).json({
        message: "Organization name, type (donor/ngo), address, and city are required",
      });
    }

    if (!["donor", "ngo"].includes(type)) {
      return res.status(400).json({
        message: "Organization type must be either 'donor' or 'ngo'",
      });
    }

    // 1 User = 1 Organization check
    const existingOrg = await Organization.findOne({ user: req.user._id });
    if (existingOrg) {
      return res.status(409).json({
        message: "You already have an organization registered under this account",
        organization: existingOrg,
      });
    }

    // Handle coordinates if provided: [longitude, latitude]
    let locationObj = { type: "Point", coordinates: [0, 0] };
    if (Array.isArray(coordinates) && coordinates.length === 2) {
      locationObj.coordinates = [Number(coordinates[0]), Number(coordinates[1])];
    }

    const organization = await Organization.create({
      user: req.user._id,
      name: name.trim(),
      type,
      address: address.trim(),
      city: city.trim(),
      contactPhone: contactPhone?.trim() || req.user.phone || null,
      location: locationObj,
      isVerified: false, // Default requires verification for safety
    });

    // Link organization to User and align user role
    await User.findByIdAndUpdate(req.user._id, {
      organizationId: organization._id,
      role: type === "ngo" ? "ngo" : "donor",
    });

    return res.status(201).json({
      message: "Organization created successfully",
      organization,
    });
  } catch (error) {
    console.error("Create organization error:", error.message);
    return res.status(500).json({ message: "Server error creating organization" });
  }
};

// @desc    Get current user's organization profile
// @route   GET /api/organizations/me
// @access  Private
const getMyOrganization = async (req, res) => {
  try {
    const organization = await Organization.findOne({ user: req.user._id });

    if (!organization) {
      return res.status(404).json({
        message: "No organization profile found for this account",
      });
    }

    return res.status(200).json({ organization });
  } catch (error) {
    console.error("Get my organization error:", error.message);
    return res.status(500).json({ message: "Server error fetching organization profile" });
  }
};

// @desc    Update current user's organization profile
// @route   PUT /api/organizations/me
// @access  Private
const updateMyOrganization = async (req, res) => {
  try {
    const { name, address, city, contactPhone, coordinates } = req.body;

    const organization = await Organization.findOne({ user: req.user._id });

    if (!organization) {
      return res.status(404).json({
        message: "No organization found to update",
      });
    }

    if (name?.trim()) organization.name = name.trim();
    if (address?.trim()) organization.address = address.trim();
    if (city?.trim()) organization.city = city.trim();
    if (contactPhone !== undefined) organization.contactPhone = contactPhone ? contactPhone.trim() : null;

    if (Array.isArray(coordinates) && coordinates.length === 2) {
      organization.location = {
        type: "Point",
        coordinates: [Number(coordinates[0]), Number(coordinates[1])],
      };
    }

    await organization.save();

    return res.status(200).json({
      message: "Organization updated successfully",
      organization,
    });
  } catch (error) {
    console.error("Update organization error:", error.message);
    return res.status(500).json({ message: "Server error updating organization" });
  }
};

// @desc    Get organization by ID (Public profile)
// @route   GET /api/organizations/:id
// @access  Private
const getOrganizationById = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id).populate(
      "user",
      "name email phone picture"
    );

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    return res.status(200).json({ organization });
  } catch (error) {
    console.error("Get organization by ID error:", error.message);
    return res.status(500).json({ message: "Server error fetching organization" });
  }
};

module.exports = {
  createOrganization,
  getMyOrganization,
  updateMyOrganization,
  getOrganizationById,
};
