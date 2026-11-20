const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Extract JWT token from cookie or Authorization Bearer header
const extractToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }
  return req.cookies?.token || req.headers["x-access-token"] || null;
};

// Extract temporary verification token from cookie, header, or body
const extractTempToken = (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }
  return (
    req.cookies?.temp_token ||
    req.headers["x-temp-token"] ||
    req.body?.tempToken ||
    null
  );
};

// Fully authenticated routes: profile, /me, listings, organizations, etc.
const protect = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please log in to continue",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Never allow a temporary OTP token as a full login session.
    if (
      decoded.stage === "2fa_pending" ||
      decoded.stage === "email_registration_pending"
    ) {
      return res.status(401).json({
        success: false,
        message: "Please complete verification first",
      });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session. Please log in again.",
    });
  }
};

// Temporary routes: pending-user and registration/login OTP verification
const protectPending = async (req, res, next) => {
  try {
    const token = extractTempToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Verification session expired. Please request a new OTP.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      !["2fa_pending", "email_registration_pending"].includes(decoded.stage)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid verification session",
      });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    req.user = user;
    req.authStage = decoded.stage;

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Verification session expired. Please request a new OTP.",
    });
  }
};

// Role-based authorization middleware
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRole = (req.user.role || "").toUpperCase();
    const normalizedRoles = roles.map((r) => r.toUpperCase());

    // Admin always has access to all resources
    if (userRole === "ADMIN" || normalizedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Role '${req.user.role}' is not authorized. Requires: ${roles.join(", ")}`,
    });
  };
};

module.exports = {
  protect,
  protectPending,
  restrictTo,
};
