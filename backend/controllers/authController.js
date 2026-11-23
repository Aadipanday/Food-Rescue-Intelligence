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

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

const sendOtpEmail = async (user, otp, purpose) => {
  const isRegistration = purpose === "register";
  const brandName = process.env.BREVO_SENDER_NAME || "AnnaSetu Intelligence";

  await sendEmail({
    to: user.email,
    subject: isRegistration
      ? `Verify your ${brandName} account`
      : `Your ${brandName} login OTP`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:12px;background:#ffffff">
        <div style="text-align:center;margin-bottom:20px">
          <h2 style="color:#166534;margin:0;font-size:24px">${brandName}</h2>
          <p style="color:#64748b;font-size:13px;margin:4px 0 0 0">Surplus Food Redistribution & Zero-Hunger Network</p>
        </div>
        <p style="font-size:15px;color:#334155">Hello <strong>${escapeHtml(user.name)}</strong>,</p>
        <p style="font-size:14px;color:#475569;line-height:1.6">${
          isRegistration
            ? "Thank you for joining our community! Use this secure 6-digit OTP code to verify your email address and activate your account:"
            : "Use this secure 6-digit OTP code to complete your two-factor login:"
        }</p>
        <div style="text-align:center;margin:28px 0">
          <span style="font-size:36px;font-weight:bold;letter-spacing:10px;background:#f0fdf4;color:#15803d;padding:14px 28px;border-radius:10px;display:inline-block;border:1px solid #bbf7d0">${otp}</span>
        </div>
        <p style="font-size:13px;color:#64748b;text-align:center">This OTP is valid for <strong>10 minutes</strong>. Never share this code with anyone.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
        <p style="font-size:12px;color:#94a3b8;text-align:center">${brandName} — Saving food, feeding lives, reducing waste.</p>
      </div>
    `,
  });
};

const makeTempToken = (userId, stage) =>
  jwt.sign(
    { userId, stage },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

// 1. REGISTER: create an account and send email OTP (or update & resend if unverified)
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    // Handle existing user
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists. Please log in.",
        });
      }

      // Existing unverified account: refresh credentials, generate fresh OTP, and send email
      const otp = generateOtp();
      existingUser.name = name.trim();
      existingUser.password = await bcrypt.hash(password, 12);
      if (phone) existingUser.phone = phone.trim();
      if (role) existingUser.role = role.trim();
      existingUser.emailOtp = hashOtp(otp);
      existingUser.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      existingUser.emailOtpPurpose = "register";
      await existingUser.save();

      try {
        await sendOtpEmail(existingUser, otp, "register");
      } catch (emailError) {
        console.error("Register send email error:", emailError.response?.data || emailError.message);
        return res.status(500).json({
          success: false,
          message: "Failed to send verification email. Please verify email address and try again.",
        });
      }

      const tempToken = makeTempToken(existingUser._id, "email_registration_pending");
      res.cookie("temp_token", tempToken, tempCookieOptions);

      return res.status(200).json({
        success: true,
        message: "An unverified registration was found. A fresh verification OTP has been sent to your email.",
        requiresEmailVerification: true,
        tempToken,
        devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
        user: {
          id: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
      });
    }

    // Create fresh user
    const otp = generateOtp();

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      phone: phone?.trim() || null,
      role: role?.trim() || "user",
      isEmailVerified: false,
      emailOtp: hashOtp(otp),
      emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      emailOtpPurpose: "register",
    });

    try {
      await sendOtpEmail(user, otp, "register");
    } catch (emailError) {
      await User.findByIdAndDelete(user._id);
      console.error("Send OTP Email error during register:", emailError.response?.data || emailError.message);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please verify email address and try again.",
      });
    }

    const tempToken = makeTempToken(user._id, "email_registration_pending");
    res.cookie("temp_token", tempToken, tempCookieOptions);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please enter the OTP sent to your email.",
      requiresEmailVerification: true,
      tempToken,
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed. Please try again.",
    });
  }
};

// 2. RESEND VERIFICATION OTP (Can be called by email or pending session)
const resendVerificationOtp = async (req, res) => {
  try {
    const { email } = req.body;
    let user = null;

    if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    } else if (req.user?._id) {
      user = await User.findById(req.user._id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found with the provided email",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Your email is already verified. Please log in.",
      });
    }

    const otp = generateOtp();
    user.emailOtp = hashOtp(otp);
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.emailOtpPurpose = "register";
    await user.save();

    await sendOtpEmail(user, otp, "register");

    const tempToken = makeTempToken(user._id, "email_registration_pending");
    res.cookie("temp_token", tempToken, tempCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Verification OTP resent to your email.",
      tempToken,
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (error) {
    console.error("Resend OTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to resend verification OTP. Please try again.",
    });
  }
};

// 3. PASSWORD LOGIN: password is checked first, then OTP or session issued
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // If user is unverified, send fresh OTP and provide tempToken
    if (!user.isEmailVerified) {
      const otp = generateOtp();
      user.emailOtp = hashOtp(otp);
      user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      user.emailOtpPurpose = "register";
      await user.save();

      try {
        await sendOtpEmail(user, otp, "register");
      } catch (err) {
        console.error("Error sending verification OTP on login:", err.message);
      }

      const tempToken = makeTempToken(user._id, "email_registration_pending");
      res.cookie("temp_token", tempToken, tempCookieOptions);

      return res.status(200).json({
        success: false,
        message: "Your email is not verified yet. A verification OTP has been sent to your email.",
        requiresEmailVerification: true,
        tempToken,
        devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    // User is verified: issue authenticated JWT session token!
    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);
    res.clearCookie("temp_token", tempCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        organization: user.organization || null,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

const getPendingUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
    },
  });
};

// Send email OTP for login verification
const sendEmailOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otp = generateOtp();
    const isRegisterStage = req.authStage === "email_registration_pending" || !user.isEmailVerified;
    const purpose = isRegisterStage ? "register" : "login";

    user.emailOtp = hashOtp(otp);
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.emailOtpPurpose = purpose;
    await user.save();

    try {
      await sendOtpEmail(user, otp, purpose);
    } catch (error) {
      user.emailOtp = null;
      user.emailOtpExpires = null;
      user.emailOtpPurpose = null;
      await user.save();
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: `Email OTP sent successfully for ${purpose}`,
    });
  } catch (error) {
    console.error("Send email OTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to send email OTP. Please try again.",
    });
  }
};

// Verify either registration OTP or login OTP
const verifyEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.emailOtp || !user.emailOtpExpires) {
      return res.status(400).json({ success: false, message: "Please request a new OTP first" });
    }

    if (user.emailOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    if (user.emailOtp !== hashOtp(otp)) {
      return res.status(400).json({ success: false, message: "Invalid OTP. Please check and re-enter." });
    }

    const purpose = user.emailOtpPurpose;

    user.emailOtp = null;
    user.emailOtpExpires = null;
    user.emailOtpPurpose = null;

    if (purpose === "register" || !user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
      res.clearCookie("temp_token", tempCookieOptions);

      // Issue active session token so user doesn't have to log in immediately
      const token = generateToken(user._id);
      res.cookie("token", token, cookieOptions);

      return res.status(200).json({
        success: true,
        message: "Email verified successfully! You are now logged in.",
        emailVerified: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          organization: user.organization || null,
        },
      });
    }

    if (purpose !== "login") {
      await user.save();
      return res.status(400).json({
        success: false,
        message: "OTP purpose is invalid. Please request a new OTP.",
      });
    }

    await user.save();

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);
    res.clearCookie("temp_token", tempCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        picture: user.picture || null,
        organization: user.organization || null,
      },
    });
  } catch (error) {
    console.error("Verify email OTP error:", error.message);
    return res.status(500).json({ success: false, message: "Email OTP verification failed" });
  }
};

// Send SMS OTP for login
const sendPhoneOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.phone) {
      return res.status(400).json({
        success: false,
        message: "No phone number registered. Please use Email OTP.",
      });
    }

    const otp = generateOtp();
    user.phoneOtp = otp;
    user.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendSmsOtp({ phone: user.phone, otp });

    return res.status(200).json({ success: true, message: "SMS OTP sent successfully" });
  } catch (error) {
    console.error("Send phone OTP error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to send SMS OTP. Please try Email OTP.",
    });
  }
};

// Verify SMS OTP for login
const verifyPhoneOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required" });
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.phoneOtp || !user.phoneOtpExpires) {
      return res.status(400).json({ success: false, message: "Request a new SMS OTP first" });
    }

    if (user.phoneOtpExpires.getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "SMS OTP expired" });
    }

    if (user.phoneOtp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid SMS OTP" });
    }

    user.phoneOtp = null;
    user.phoneOtpExpires = null;
    await user.save();

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);
    res.clearCookie("temp_token", tempCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        picture: user.picture || null,
        organization: user.organization || null,
      },
    });
  } catch (error) {
    console.error("Verify phone OTP error:", error.message);
    return res.status(500).json({ success: false, message: "SMS OTP verification failed" });
  }
};

// Google OAuth Login
const googleLogin = async (req, res) => {
  try {
    const { credential, role } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified || !payload.sub) {
      return res.status(401).json({
        success: false,
        message: "Google email could not be verified",
      });
    }

    const email = payload.email.toLowerCase().trim();
    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email }],
    });

    if (user) {
      // Seamlessly link Google ID if not yet linked
      if (!user.googleId) user.googleId = payload.sub;
      user.isEmailVerified = true;
      if (payload.name && !user.name) user.name = payload.name;
      if (payload.picture) user.picture = payload.picture;
      if (role && (!user.role || user.role === "user")) user.role = role;
      await user.save();
    } else {
      user = await User.create({
        name: payload.name || "Google User",
        email,
        password: null,
        googleId: payload.sub,
        picture: payload.picture || null,
        isEmailVerified: true,
        role: role || "donor",
      });
    }

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions);
    res.clearCookie("temp_token", tempCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        picture: user.picture || null,
        organization: user.organization || null,
      },
    });
  } catch (error) {
    console.error("Google login error:", error.message);
    return res.status(401).json({ success: false, message: "Google authentication failed" });
  }
};

// Current authenticated user profile
const getMeHandler = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("organization");

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        picture: user.picture || null,
        googleId: user.googleId,
        organization: user.organization || null,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

// Update Profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone ? phone.trim() : null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        picture: user.picture || null,
        googleId: user.googleId,
        organization: user.organization || null,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

// Logout
const logout = async (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.clearCookie("temp_token", tempCookieOptions);
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

module.exports = {
  register,
  resendVerificationOtp,
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
