const User = require("../models/User");
const Organization = require("../models/Organization");
const FoodListing = require("../models/FoodListing");

// 1. Get all organizations with verification filtering
const getAllOrganizations = async (req, res) => {
  try {
    const { status, type, search } = req.query;

    const query = {};
    if (status) query.verificationStatus = status;
    if (type) query.type = type;
    if (search) query.name = new RegExp(search.trim(), "i");

    const organizations = await Organization.find(query)
      .populate("owner", "name email phone picture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: organizations.length,
      organizations,
    });
  } catch (error) {
    console.error("Admin get organizations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch organizations",
    });
  }
};

// 2. Approve or Reject an Organization
const verifyOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be APPROVED, REJECTED, or PENDING",
      });
    }

    const organization = await Organization.findById(id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    organization.verificationStatus = status;
    if (note !== undefined) organization.verificationNote = note;
    await organization.save();

    return res.status(200).json({
      success: true,
      message: `Organization ${status.toLowerCase()} successfully`,
      organization,
    });
  } catch (error) {
    console.error("Verify organization error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify organization",
    });
  }
};

// 3. Get all registered users
const getAllUsers = async (req, res) => {
  try {
    const { role, isVerified, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isVerified !== undefined) query.isEmailVerified = isVerified === "true";
    if (search) {
      query.$or = [
        { name: new RegExp(search.trim(), "i") },
        { email: new RegExp(search.trim(), "i") },
      ];
    }

    const users = await User.find(query)
      .select("-password -emailOtp -phoneOtp")
      .populate("organization", "name type verificationStatus")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// 4. Update user role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = [
      "user",
      "admin",
      "food_provider",
      "ngo",
      "FOOD_PROVIDER",
      "NGO",
      "ADMIN",
      "USER",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed: ${allowedRoles.join(", ")}`,
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin update role error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};

module.exports = {
  getAllOrganizations,
  verifyOrganization,
  getAllUsers,
  updateUserRole,
};
