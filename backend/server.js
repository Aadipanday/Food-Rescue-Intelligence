require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

const { connectDB, closeDB } = require("./config/db");
const {
  authLimiter,
  apiLimiter,
  sanitizeInput,
  securityHeaders,
} = require("./middleware/securityMiddleware");
const { startScheduler, stopScheduler } = require("./services/schedulerService");
const { initSocket } = require("./services/socketService");

// Route imports
const authRoutes = require("./routes/authRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const listingRoutes = require("./routes/listingRoutes");
const claimRoutes = require("./routes/claimRoutes");
const aiRoutes = require("./routes/aiRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Validate critical configuration on startup
if (!process.env.JWT_SECRET) {
  console.warn("[Security Warning] JWT_SECRET not configured in environment variables. Using fallback secret.");
  process.env.JWT_SECRET = "annasetu_production_jwt_secret_key_2026_fallback";
}

// 1. Trust proxy if behind a reverse proxy (e.g., NGINX, Heroku, Render, Cloudflare)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// 2. Production Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
  })
);
app.use(securityHeaders);

// 3. Flexible Production & Development CORS Configuration
const rawClientUrl = process.env.CLIENT_URL || "";
const configuredOrigins = rawClientUrl
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

const allowedOrigins = [...new Set([...configuredOrigins, ...defaultOrigins])];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const normalized = origin.replace(/\/+$/, "");

      const isAllowed =
        allowedOrigins.includes("*") ||
        allowedOrigins.includes(normalized) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized) ||
        /\.vercel\.app$/.test(normalized) ||
        /\.netlify\.app$/.test(normalized) ||
        /\.onrender\.com$/.test(normalized) ||
        /\.railway\.app$/.test(normalized);

      if (isAllowed) {
        return callback(null, true);
      }

      // Allow origin dynamically so deployed frontend on custom domains never encounters CORS preflight errors
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-access-token", "x-temp-token"],
  })
);

// 4. Request Body Parsers with Safe Size Limits (Prevents Payload Flooding)
app.use(express.json({ limit: "250kb" }));
app.use(express.urlencoded({ extended: true, limit: "250kb" }));
app.use(cookieParser());

// 5. NoSQL Injection Prevention & Data Sanitization
app.use(sanitizeInput);

// 6. Base Health Check & System Status
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AnnaSetu Intelligence API is running securely.",
    status: "healthy",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
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

// 7. Route Mounting (Supports both /api/* and root /* for deployment flexibility)
app.use("/api/auth", authLimiter, authRoutes);
app.use("/auth", authLimiter, authRoutes);
app.use("/api/aut", authLimiter, authRoutes);
app.use("/aut", authLimiter, authRoutes);

// Apply general API rate limiter on all remaining resources
app.use("/api", apiLimiter);

// 8. Protected & Public Feature Routes Mounting (Dual prefix support)
app.use("/api/organizations", organizationRoutes);
app.use("/organizations", organizationRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/organization", organizationRoutes);

app.use("/api/listings", listingRoutes);
app.use("/listings", listingRoutes);

app.use("/api/claims", claimRoutes);
app.use("/claims", claimRoutes);

app.use("/api/ai", aiRoutes);
app.use("/ai", aiRoutes);

app.use("/api/analytics", analyticsRoutes);
app.use("/analytics", analyticsRoutes);

app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);

// 9. 404 Handler for Undefined Endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// 10. Production Centralized Error Handling Middleware (No Stack Leakage)
app.use((err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Log full stack internally for server debugging
  console.error(`[Error] ${req.method} ${req.originalUrl} -`, err.stack || err.message);

  // Return clean, unrevealing message to clients
  const statusCode = err.status || (res.statusCode === 200 ? 500 : res.statusCode);
  return res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode === 500
      ? "An unexpected internal server error occurred. Please try again later."
      : err.message || "Internal server error",
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

// Initialize Socket.io WebSockets
initSocket(httpServer);

let serverInstance = null;

const startServer = async () => {
  await connectDB();

  // Start background food shelf-life auto-expiry monitor
  startScheduler();

  serverInstance = httpServer.listen(PORT, () => {
    console.log(
      `[Server] Food Rescue Intelligence API & WebSockets running securely in ${
        process.env.NODE_ENV || "development"
      } mode on port ${PORT}`
    );
  });
};

// Graceful Process Termination (SIGTERM / SIGINT)
const handleGracefulShutdown = async (signal) => {
  console.log(`\n[Process] Received ${signal}. Starting graceful shutdown...`);

  // Stop background scheduler
  stopScheduler();

  // Stop incoming HTTP requests
  if (serverInstance) {
    serverInstance.close(() => {
      console.log("[Server] Closed all active HTTP connections.");
    });
  }

  // Close MongoDB socket pool
  await closeDB();

  console.log("[Process] Graceful shutdown completed. Exiting.");
  process.exit(0);
};

process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));

// Only run server when directly executed
if (require.main === module) {
  startServer();
}

module.exports = app;
