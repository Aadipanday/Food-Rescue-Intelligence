
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const generateOtp = require("../utils/generateOtp");
const sendSmsOtp = require("../utils/sendSmsOtp");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const tempCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 15 * 60 * 1000,
};

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp).trim()).digest("hex");

const sendOtpEmail = async (user, otp, purpose) => {
  const isRegistration = purpose === "register";

  await sendEmail({
    to: user.email,
    subject: isRegistration
      ? "Verify your FoodRescue Intelligence account"
      : "Your FoodRescue Intelligence login OTP",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px">
        <h2>FoodRescue Intelligence</h2>
        <p>Hello ${escapeHtml(user.name)},</p>
        <p>${isRegistration ? "Use this OTP to verify your email address:" : "Use this OTP to complete your login:"}</p>
        <h1 style="letter-spacing:8px">${otp}</h1>
        <p>This OTP expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

const makeTempToken = (userId, stage) =>
  jwt.sign(
    { userId, stage },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

// REGISTER: create an unverified account and send email OTP
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        message: existingUser.isEmailVerified
          ? "An account with this email already exists"
          : "An unverified account already exists. Please request a new OTP or contact support.",
      });
    }

    const otp = generateOtp();

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      phone: phone?.trim() || null,
      isEmailVerified: false,
      emailOtp: hashOtp(otp),
      emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      emailOtpPurpose: "register",
    });

    try {
      await sendOtpEmail(user, otp, "register");
    } catch (emailError) {
      await User.findByIdAndDelete(user._id);
      throw emailError;
    }

    const tempToken = makeTempToken(user._id, "email_registration_pending");
    res.cookie("temp_token", tempToken, tempCookieOptions);

    return res.status(201).json({
      message: "Registration created. Enter the OTP sent to your email.",
      requiresEmailVerification: true,
      tempToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
  console.error(
    "Register error:",
    error.response?.data || error.message
  );

  return res.status(500).json({
    message: "Registration failed. Please try again."
  });
}
};

// PASSWORD LOGIN: password is checked first, then OTP is required
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        requiresEmailVerification: true,
      });
    }

    const tempToken = makeTempToken(user._id, "2fa_pending");
    res.cookie("temp_token", tempToken, tempCookieOptions);

    return res.status(200).json({
      message: "Password verified. Choose Email OTP or SMS OTP.",
      requiresOtp: true,
      tempToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error during login" });
  }
};

const getPendingUser = async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
    },
  });
};

// Send email OTP for the login two-step verification flow
const sendEmailOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Verify your email before using login OTP.",
      });
    }

    const otp = generateOtp();
    user.emailOtp = hashOtp(otp);
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.emailOtpPurpose = "login";
    await user.save();

    try {
      await sendOtpEmail(user, otp, "login");
    } catch (error) {
      user.emailOtp = null;
      user.emailOtpExpires = null;
      user.emailOtpPurpose = null;
      await user.save();
      throw error;
    }

    return res.status(200).json({ message: "Email OTP sent successfully" });
  } catch (error) {
    console.error("Send email OTP error:", error.message);
    return res.status(500).json({
      message: "Unable to send email OTP. Please try again.",
    });
  }
};

// Verify either registration OTP or login OTP based on its purpose
const verifyEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.emailOtp || !user.emailOtpExpires) {
      return res.status(400).json({ message: "Request a new OTP first" });
    }

    if (user.emailOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({
        message: "OTP expired. Please request a new OTP.",
      });
    }

    if (user.emailOtp !== hashOtp(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const purpose = user.emailOtpPurpose;

    user.emailOtp = null;
    user.emailOtpExpires = null;
    user.emailOtpPurpose = null;

    if (purpose === "register") {
      user.isEmailVerified = true;
      await user.save();
      res.clearCookie("temp_token", tempCookieOptions);

      return res.status(200).json({
        message: "Email verified successfully. You can now log in.",
        emailVerified: true,
      });
    }

    if (purpose !== "login") {
      await user.save();
      return res.status(400).json({
        message: "OTP purpose is invalid. Please request a new OTP.",
      });
    }

    await user.save();

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);
    res.clearCookie("temp_token", tempCookieOptions);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        picture: user.picture || null,
      },
    });
  } catch (error) {
    console.error("Verify email OTP error:", error.message);
    return res.status(500).json({ message: "Email OTP verification failed" });
  }
};

// SMS OTP for login
const sendPhoneOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.phone) {
      return res.status(400).json({
        message: "No phone number registered. Please use Email OTP.",
      });
    }

    const otp = generateOtp();
    user.phoneOtp = otp;
    user.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendSmsOtp({ phone: user.phone, otp });

    return res.status(200).json({ message: "SMS OTP sent successfully" });
  } catch (error) {
    console.error("Send phone OTP error:", error.message);
    return res.status(500).json({
      message: "Unable to send SMS OTP. Please try Email OTP.",
    });
  }
};

const verifyPhoneOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.phoneOtp || !user.phoneOtpExpires) {
      return res.status(400).json({ message: "Request a new SMS OTP first" });
    }

    if (user.phoneOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "SMS OTP expired" });
    }

    if (user.phoneOtp !== String(otp).trim()) {
      return res.status(400).json({ message: "Invalid SMS OTP" });
    }

    user.phoneOtp = null;
    user.phoneOtpExpires = null;
    await user.save();

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);
    res.clearCookie("temp_token", tempCookieOptions);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        picture: user.picture || null,
      },
    });
  } catch (error) {
    console.error("Verify phone OTP error:", error.message);
    return res.status(500).json({ message: "SMS OTP verification failed" });
  }
};

// GOOGLE LOGIN: Google verifies the identity; no additional OTP required
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified || !payload.sub) {
      return res.status(401).json({
        message: "Google email could not be verified",
      });
    }

    const email = payload.email.toLowerCase().trim();
    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email }],
    });

    if (user) {
      // Do not silently link a password account to Google.
      if (!user.googleId && user.password) {
        return res.status(409).json({
          message: "An email/password account already exists. Log in with that account first.",
          accountLinkRequired: true,
        });
      }

      if (!user.googleId) user.googleId = payload.sub;
      user.isEmailVerified = true;
      if (payload.name) user.name = payload.name;
      if (payload.picture) user.picture = payload.picture;
      await user.save();
    } else {
      user = await User.create({
        name: payload.name || "Google User",
        email,
        password: null,
        googleId: payload.sub,
        picture: payload.picture || null,
        isEmailVerified: true,
      });
    }

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);
    res.clearCookie("temp_token", tempCookieOptions);

    return res.status(200).json({
      message: "Google login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        picture: user.picture || null,
      },
    });
  } catch (error) {
    console.error("Google login error:", error.message);
    return res.status(401).json({ message: "Google authentication failed" });
  }
};

const getMe = async (req, res) => ({
  user: {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    picture: req.user.picture || null,
    googleId: req.user.googleId,
    createdAt: req.user.createdAt,
  },
});

const getMeHandler = async (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      picture: req.user.picture || null,
      googleId: req.user.googleId,
      createdAt: req.user.createdAt,
    },
  });
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone ? phone.trim() : null;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        picture: user.picture || null,
        googleId: user.googleId,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

const logout = async (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.clearCookie("temp_token", tempCookieOptions);
  return res.status(200).json({ message: "Logged out successfully" });
};

module.exports = {
  register,
  login,
  getPendingUser,
  googleLogin,
  sendEmailOtp,
  verifyEmailOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
  getMe: getMeHandler,
  updateProfile,
  logout,
};
