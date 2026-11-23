const dns = require("dns");
const mongoose = require("mongoose");

// Ensure public DNS fallback for MongoDB Atlas SRV resolution
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // Ignore if not permitted
}

const resolver = new dns.Resolver();
try {
  resolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // Ignore if not permitted
}

// Custom lookup to prevent local ISP/Wi-Fi DNS sinkholing (192.0.2.1) on MongoDB Atlas shard domains
const customLookup = (hostname, options, callback) => {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  // Localhost resolution
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return dns.lookup(hostname, options, callback);
  }

  resolver.resolve4(hostname, (err, addresses) => {
    if (err || !addresses || addresses.length === 0) {
      return dns.lookup(hostname, options, callback);
    }
    if (options && options.all) {
      return callback(
        null,
        addresses.map((a) => ({ address: a, family: 4 }))
      );
    }
    return callback(null, addresses[0], 4);
  });
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      lookup: customLookup,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2,  // Keep at least 2 connections open
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error("[MongoDB Error] Connection failed:", error.message);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.warn("\n=======================================================");
      console.warn("[MongoDB Notice] Database connection is pending/offline.");
      console.warn("  • If using local MongoDB: Ensure service is running ('net start MongoDB' or 'mongod')");
      console.warn("  • If using MongoDB Atlas: Verify your IP is whitelisted (0.0.0.0/0) in Atlas Network Access");
      console.warn("  • Server will continue running for health-checks & API endpoints.");
      console.warn("=======================================================\n");
    }
  }
};

// Listen to connection state events
mongoose.connection.on("error", (err) => {
  console.error("[MongoDB Error] Event error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("[MongoDB Warning] Lost database connection. Reconnecting...");
});

mongoose.connection.on("reconnected", () => {
  console.log("[MongoDB] Reconnected to database cluster.");
});

// Clean shutdown helper
const closeDB = async () => {
  try {
    await mongoose.connection.close(false);
    console.log("[MongoDB] Connection closed cleanly.");
  } catch (err) {
    console.error("[MongoDB Error] Error during connection close:", err.message);
  }
};

module.exports = {
  connectDB,
  closeDB,
};
