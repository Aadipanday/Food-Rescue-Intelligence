
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Fully authenticated routes: profile, /me, etc.
const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Please log in to continue",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Never allow a temporary OTP token as a full login session.
    if (decoded.stage === "2fa_pending" ||
        decoded.stage === "email_registration_pending") {
      return res.status(401).json({
        message: "Please complete verification first",
      });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired session. Please log in again.",
    });
  }
};

// Temporary routes: pending-user and login OTP verification
const protectPending = async (req, res, next) => {
  try {
    const token =
      req.cookies?.temp_token ||
      req.headers["x-temp-token"] ||
      req.body?.tempToken;

    if (!token) {
      return res.status(401).json({
        message: "Verification session expired. Please log in again.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      !["2fa_pending", "email_registration_pending"].includes(decoded.stage)
    ) {
      return res.status(401).json({
        message: "Invalid verification session",
      });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    req.user = user;
    req.authStage = decoded.stage;

    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Verification session expired. Please try again.",
    });
  }
};

module.exports = {
  protect,
  protectPending,
};
