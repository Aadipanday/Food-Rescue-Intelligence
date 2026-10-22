const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || "",
  role: user.role,
  authProviders: user.authProviders,
});

// REGISTER WITH EMAIL AND PASSWORD
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        message: "Name must be at most 100 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Enter a valid email address",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must be 8–72 characters long",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      authProviders: ["email"],
    });

    const token = createToken(user._id.toString());
    setAuthCookie(res, token);

    return res.status(201).json({
      message: "Registration successful",
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
};

// LOGIN WITH EMAIL AND PASSWORD
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !user.password) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = createToken(user._id.toString());
    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Login successful",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Login failed",
    });
  }
};

// LOGIN OR REGISTER WITH GOOGLE
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (
      typeof credential !== "string" ||
      !credential
    ) {
      return res.status(400).json({
        message: "Google credential is required",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (
      !payload ||
      !payload.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        message: "Google account verification failed",
      });
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        // Link the verified Google account to the existing account.
        user.googleId = payload.sub;
        user.authProviders = [
          ...new Set([
            ...(user.authProviders || []),
            "google",
          ]),
        ];

        if (!user.avatar && payload.picture) {
          user.avatar = payload.picture;
        }

        await user.save();
      } else {
        user = await User.create({
          name: payload.name || email.split("@")[0],
          email,
          googleId: payload.sub,
          avatar: payload.picture || "",
          authProviders: ["google"],
        });
      }
    }

    const token = createToken(user._id.toString());
    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Google login successful",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Google login error:", error.message);

    return res.status(401).json({
      message: "Google authentication failed",
    });
  }
};

// GET CURRENT USER
exports.getMe = async (req, res) => {
  return res.status(200).json({
    user: publicUser(req.user),
  });
};

// LOGOUT
exports.logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
};