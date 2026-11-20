const express = require("express");
const router = express.Router();

const {
  getAllOrganizations,
  verifyOrganization,
  getAllUsers,
  updateUserRole,
} = require("../controllers/adminController");

const { protect, restrictTo } = require("../middleware/authMiddleware");

// All admin routes are protected and restricted to admin role
router.use(protect);
router.use(restrictTo("admin", "ADMIN"));

router.get("/organizations", getAllOrganizations);
router.patch("/organizations/:id/verify", verifyOrganization);
router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);

module.exports = router;
