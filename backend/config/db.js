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
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("[MongoDB Error] MONGO_URI is not defined in environment variables!");
    return;
  }

  // Attempt 1: Standard Mongoose connection (Ideal for cloud deployment on Render, Railway, Vercel)
  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (standardError) {
    console.warn("[MongoDB Notice] Standard connection failed, attempting with custom DNS resolver...", standardError.message);

    // Attempt 2: Custom DNS resolver (Fallback for local ISP DNS sinkholing)
    try {
      const conn = await mongoose.connect(uri, {
        lookup: customLookup,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      });

      console.log(`[MongoDB] Connected with custom DNS fallback to host: ${conn.connection.host}`);
      return conn;
    } catch (fallbackError) {
      console.error("[MongoDB Error] Connection failed on all attempts:", fallbackError.message);
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
