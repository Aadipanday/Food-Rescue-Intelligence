const express = require("express");
const router = express.Router();

const {
  registerOrganization,
  getMyOrganization,
  updateOrganization,
  getAllOrganizations,
  getOrganizationById,
} = require("../controllers/organizationController");

const { protect } = require("../middleware/authMiddleware");

// Public routes
router.get("/", getAllOrganizations);
router.get("/my", protect, getMyOrganization);
router.get("/:id", getOrganizationById);

// Authenticated organization management
router.post("/register", protect, registerOrganization);
router.put("/update", protect, updateOrganization);

module.exports = router;
