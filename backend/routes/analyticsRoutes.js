const express = require("express");
const router = express.Router();

const {
  getPlatformImpact,
  getUserImpact,
} = require("../controllers/analyticsController");

const { protect } = require("../middleware/authMiddleware");

router.get("/impact", getPlatformImpact);
router.get("/my-impact", protect, getUserImpact);

module.exports = router;
