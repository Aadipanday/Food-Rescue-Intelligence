const rateLimit = require("express-rate-limit");

/**
 * 1. Strict Rate Limiter for Authentication & OTP Endpoints
 * Prevents brute-force credential stuffing and SMS/Email OTP flooding.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // Limit each IP to 25 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
  },
});

/**
 * 2. General API Rate Limiter
 * Guards the API against DDoS and rapid scrape loops.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please slow down.",
  },
});

/**
 * 3. Custom Deep NoSQL Injection Sanitizer
 * Recursively strips keys starting with '$' or containing '.' in req.body, req.query, and req.params
 * to prevent MongoDB operator injection (e.g. { "email": { "$gt": "" } }).
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const clean = {};
  for (const key of Object.keys(obj)) {
    // Prohibit keys starting with $ or containing dots (MongoDB operators)
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    clean[key] = sanitizeObject(obj[key]);
  }
  return clean;
};

const sanitizeInput = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

/**
 * 4. Production Security Headers & CORS Validator
 */
const securityHeaders = (req, res, next) => {
  // Prevent MIME-type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Prevent clickjacking via iframes
  res.setHeader("X-Frame-Options", "DENY");
  // Enable XSS filtering in browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Enforce HTTPS in production via HSTS (Strict-Transport-Security)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  next();
};

module.exports = {
  authLimiter,
  apiLimiter,
  sanitizeInput,
  securityHeaders,
};
