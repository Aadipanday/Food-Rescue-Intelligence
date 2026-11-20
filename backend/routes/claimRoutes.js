const express = require("express");
const router = express.Router();

const {
  getMyClaims,
  getIncomingClaims,
  getClaimById,
  cancelClaim,
} = require("../controllers/claimController");

const { protect } = require("../middleware/authMiddleware");

router.get("/my", protect, getMyClaims);
router.get("/incoming", protect, getIncomingClaims);
router.get("/:id", protect, getClaimById);
router.post("/:id/cancel", protect, cancelClaim);

module.exports = router;
