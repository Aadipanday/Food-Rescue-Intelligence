const express = require("express");
const {
  createOrganization,
  getMyOrganization,
  updateMyOrganization,
  getOrganizationById,
} = require("../controllers/organizationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All organization routes require a logged-in user
router.use(protect);

router.route("/")
  .post(createOrganization);

router.route("/me")
  .get(getMyOrganization)
  .put(updateMyOrganization);

router.route("/:id")
  .get(getOrganizationById);

module.exports = router;
