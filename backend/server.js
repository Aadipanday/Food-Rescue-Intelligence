require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const listingRoutes = require("./routes/listingRoutes");
const claimRoutes = require("./routes/claimRoutes");
const aiRoutes = require("./routes/aiRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

if (!process.env.JWT_SECRET || !process.env.GOOGLE_CLIENT_ID) {
  throw new Error(
    "JWT_SECRET and GOOGLE_CLIENT_ID must be configured in .env"
  );
}

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));
app.use(cookieParser());

// Base Health Check
app.get("/", (req, res) => {
  res.json({
    message: "Food Rescue Intelligence API is running",
    status: "healthy",
    categories: ["FOOD_PROVIDER", "NGO"],
    endpoints: {
      auth: "/api/auth",
      organizations: "/api/organizations",
      listings: "/api/listings",
      claims: "/api/claims",
      ai: "/api/ai",
      analytics: "/api/analytics",
      admin: "/api/admin",
    },
  });
});

// Routes Mounting
app.use("/api/auth", authRoutes);

// Organization routes (mounted with /api/organizations, /organization, and /api/organization for full backwards compatibility)
app.use("/api/organizations", organizationRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/organization", organizationRoutes);

// Food listings & Rescue claims
app.use("/api/listings", listingRoutes);
app.use("/api/claims", claimRoutes);

// AI & Analytics
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);

// Admin dashboard & approvals
app.use("/api/admin", adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Food Rescue Intelligence API Server running on port ${PORT}`);
  });
};

// Only run server when directly executed
if (require.main === module) {
  startServer();
}

module.exports = app;
