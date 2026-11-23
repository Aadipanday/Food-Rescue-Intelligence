const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

const initSocket = (httpServer) => {
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

  io = new Server(httpServer, {
    cors: {
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

        return callback(null, true);
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Optional JWT Authentication Middleware for Sockets
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
      } catch (err) {
        // Allow unauthenticated connections for public live tracking / mesh view,
        // but mark socket.user as null
        socket.user = null;
      }
    }
    return next();
  });

  io.on("connection", (socket) => {
    // 1. Join user-specific & org-specific rooms if authenticated
    if (socket.user?._id) {
      socket.join(`user_${socket.user._id}`);
      if (socket.user.organization) {
        socket.join(`org_${socket.user.organization}`);
      }
    }

    // Always join public global mesh room for live broadcast alerts
    socket.join("global_mesh");

    // 2. Client requests to join a specific rescue / listing tracking room
    socket.on("join_rescue_room", (rescueId) => {
      if (rescueId) {
        socket.join(`rescue_${rescueId}`);
      }
    });

    socket.on("leave_rescue_room", (rescueId) => {
      if (rescueId) {
        socket.leave(`rescue_${rescueId}`);
      }
    });

    // 3. Client explicit room join for organization
    socket.on("join_org_room", (orgId) => {
      if (orgId) {
        socket.join(`org_${orgId}`);
      }
    });

    // 4. Real-time Live GPS Coordinates Broadcast (Driver En Route)
    socket.on("driver_location_update", (data) => {
      const { rescueId, coordinates, etaMinutes, speedKmh } = data || {};
      if (rescueId && coordinates) {
        // Broadcast to anyone tracking this rescue
        io.to(`rescue_${rescueId}`).emit("driver_location_updated", {
          rescueId,
          coordinates,
          etaMinutes,
          speedKmh,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

// Event Emitters for Backend Controllers

// 1. When a donor posts a new food donation
const emitListingCreated = (listing) => {
  if (!io) return;
  io.to("global_mesh").emit("FOOD_LISTING_CREATED", {
    listing,
    message: "New surplus food batch posted nearby!",
    timestamp: new Date().toISOString(),
  });
};

// 2. When a listing is claimed by an NGO
const emitRescueRequested = (claim, listing) => {
  if (!io) return;
  const donorOrgId = listing?.organization?._id || listing?.organization;
  const donorUserId = listing?.donor?._id || listing?.donor;
  const listingId = String(listing?._id || claim?.listing);

  const payload = {
    claim,
    listing,
    message: "Incoming food rescue request awaiting your confirmation!",
    timestamp: new Date().toISOString(),
  };

  if (donorOrgId) io.to(`org_${donorOrgId}`).emit("RESCUE_REQUESTED", payload);
  if (donorUserId) io.to(`user_${donorUserId}`).emit("RESCUE_REQUESTED", payload);
  io.to(`rescue_${listingId}`).emit("RESCUE_REQUESTED", payload);
  io.to("global_mesh").emit("LISTING_STATUS_CHANGED", { listingId, status: "CLAIMED" });
};

// 3. When donor accepts rescue request
const emitRescueAccepted = (claim, listing) => {
  if (!io) return;
  const recipientOrgId = claim?.recipientOrganization?._id || claim?.recipientOrganization;
  const recipientUserId = claim?.recipientUser?._id || claim?.recipientUser;
  const listingId = String(listing?._id || claim?.listing);

  const payload = {
    claim,
    listing,
    message: "Donor accepted your rescue request! Pickup van can now be dispatched.",
    timestamp: new Date().toISOString(),
  };

  if (recipientOrgId) io.to(`org_${recipientOrgId}`).emit("RESCUE_ACCEPTED", payload);
  if (recipientUserId) io.to(`user_${recipientUserId}`).emit("RESCUE_ACCEPTED", payload);
  io.to(`rescue_${listingId}`).emit("RESCUE_ACCEPTED", payload);
};

// 4. When van is dispatched
const emitVanDispatched = (claim, listing) => {
  if (!io) return;
  const listingId = String(listing?._id || claim?.listing);
  const donorOrgId = listing?.organization?._id || listing?.organization;

  const payload = {
    claim,
    listing,
    message: "NGO pickup van is now en route to collection point!",
    timestamp: new Date().toISOString(),
  };

  if (donorOrgId) io.to(`org_${donorOrgId}`).emit("VAN_DISPATCHED", payload);
  io.to(`rescue_${listingId}`).emit("VAN_DISPATCHED", payload);
  io.to("global_mesh").emit("LISTING_STATUS_CHANGED", { listingId, status: "IN_TRANSIT" });
};

// 5. When rescue status changes (e.g. PICKED_UP, etc.)
const emitRescueStatusUpdated = (claim, listing, status) => {
  if (!io) return;
  const listingId = String(listing?._id || claim?.listing);
  const donorOrgId = listing?.organization?._id || listing?.organization;
  const recipientOrgId = claim?.recipientOrganization?._id || claim?.recipientOrganization;

  const payload = {
    claim,
    listing,
    status,
    timestamp: new Date().toISOString(),
  };

  if (donorOrgId) io.to(`org_${donorOrgId}`).emit("STATUS_UPDATED", payload);
  if (recipientOrgId) io.to(`org_${recipientOrgId}`).emit("STATUS_UPDATED", payload);
  io.to(`rescue_${listingId}`).emit("STATUS_UPDATED", payload);
  io.to("global_mesh").emit("LISTING_STATUS_CHANGED", { listingId, status });
};

// 6. When OTP is verified & handover completes
const emitHandoverVerified = (claim, listing) => {
  if (!io) return;
  const listingId = String(listing?._id || claim?.listing);
  const donorOrgId = listing?.organization?._id || listing?.organization;
  const recipientOrgId = claim?.recipientOrganization?._id || claim?.recipientOrganization;

  const payload = {
    claim,
    listing,
    message: "Handover successfully authenticated via OTP! Zero-hunger rescue completed.",
    timestamp: new Date().toISOString(),
  };

  if (donorOrgId) io.to(`org_${donorOrgId}`).emit("HANDOVER_VERIFIED", payload);
  if (recipientOrgId) io.to(`org_${recipientOrgId}`).emit("HANDOVER_VERIFIED", payload);
  io.to(`rescue_${listingId}`).emit("HANDOVER_VERIFIED", payload);
  io.to("global_mesh").emit("LISTING_STATUS_CHANGED", { listingId, status: "COMPLETED" });
};

// 7. When rescue is cancelled
const emitRescueCancelled = (claim, listing) => {
  if (!io) return;
  const listingId = String(listing?._id || claim?.listing);
  const donorOrgId = listing?.organization?._id || listing?.organization;
  const recipientOrgId = claim?.recipientOrganization?._id || claim?.recipientOrganization;

  const payload = {
    claim,
    listing,
    message: "Rescue was cancelled. Food returned to available network.",
    timestamp: new Date().toISOString(),
  };

  if (donorOrgId) io.to(`org_${donorOrgId}`).emit("RESCUE_CANCELLED", payload);
  if (recipientOrgId) io.to(`org_${recipientOrgId}`).emit("RESCUE_CANCELLED", payload);
  io.to(`rescue_${listingId}`).emit("RESCUE_CANCELLED", payload);
  io.to("global_mesh").emit("LISTING_STATUS_CHANGED", { listingId, status: "AVAILABLE" });
};

module.exports = {
  initSocket,
  getIO,
  emitListingCreated,
  emitRescueRequested,
  emitRescueAccepted,
  emitVanDispatched,
  emitRescueStatusUpdated,
  emitHandoverVerified,
  emitRescueCancelled,
};
