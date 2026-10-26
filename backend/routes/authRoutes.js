
const express = require("express");

const {
  register,
  login,
  getPendingUser,
  googleLogin,
  sendEmailOtp,
  verifyEmailOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
  getMe,
  updateProfile,
  logout,
} = require("../controllers/authController");

const {
  protect,
  protectPending,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);

router.get("/pending-user", protectPending, getPendingUser);

router.post("/send-email-otp", protectPending, sendEmailOtp);
router.post("/verify-email-otp", protectPending, verifyEmailOtp);

router.post("/send-phone-otp", protectPending, sendPhoneOtp);
router.post("/verify-phone-otp", protectPending, verifyPhoneOtp);

router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/logout", logout);

module.exports = router;
