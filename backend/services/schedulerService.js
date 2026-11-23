const FoodListing = require("../models/FoodListing");
const FoodClaim = require("../models/FoodClaim");

let schedulerInterval = null;

/**
 * Sweeper function that detects and transitions expired food listings
 */
const sweepExpiredListings = async () => {
  try {
    const now = new Date();

    // 1. Mark AVAILABLE listings past expiryTime or pickupWindow.endTime as EXPIRED
    const expiredListingsResult = await FoodListing.updateMany(
      {
        status: "AVAILABLE",
        $or: [
          { expiryTime: { $lte: now } },
          { "pickupWindow.endTime": { $lte: now } },
        ],
      },
      {
        $set: { status: "EXPIRED" },
      }
    );

    if (expiredListingsResult.modifiedCount > 0) {
      console.log(
        `[Scheduler] Auto-expired ${expiredListingsResult.modifiedCount} food listing(s) past safe consumption deadline.`
      );
    }

    // 2. Mark uncollected claims past pickupEta by more than 12 hours as CANCELLED/EXPIRED
    const overdueCutoff = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const overdueClaims = await FoodClaim.find({
      status: "ACCEPTED",
      pickupEta: { $lte: overdueCutoff },
    });

    for (const claim of overdueClaims) {
      claim.status = "CANCELLED";
      claim.completionNotes = "Auto-cancelled due to missed pickup window.";
      await claim.save();

      await FoodListing.findByIdAndUpdate(claim.listing, {
        status: "EXPIRED",
      });
    }

    if (overdueClaims.length > 0) {
      console.log(
        `[Scheduler] Cleaned up ${overdueClaims.length} abandoned claim(s).`
      );
    }
  } catch (error) {
    console.error("[Scheduler Error] Failed to sweep expired listings:", error.message);
  }
};

/**
 * Start the background cron-like scheduler (runs every 5 minutes)
 */
const startScheduler = (intervalMs = 5 * 60 * 1000) => {
  if (schedulerInterval) return;

  // Run initial sweep on boot
  sweepExpiredListings();

  schedulerInterval = setInterval(sweepExpiredListings, intervalMs);
  console.log(`[Scheduler] Background food shelf-life monitor active (interval: ${intervalMs / 1000}s).`);
};

/**
 * Stop scheduler during graceful server shutdown
 */
const stopScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Scheduler] Background scheduler stopped.");
  }
};

module.exports = {
  startScheduler,
  stopScheduler,
  sweepExpiredListings,
};
