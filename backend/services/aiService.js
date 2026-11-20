/**
 * Food Rescue Intelligence - AI Service Engine
 * Provides smart analytics, urgency scoring, NGO matching, and environmental impact computation.
 */

// Earth radius in kilometers for Haversine distance
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two coordinates using the Haversine formula
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const toRad = (angle) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10; // Round to 1 decimal
};

/**
 * Analyze food urgency, remaining shelf life, and safety recommendations
 */
const analyzeFoodUrgencyAndSafety = ({
  category,
  foodType,
  quantity,
  unit,
  storageCondition,
  expiryTime,
  cookedTime,
}) => {
  const now = new Date();
  const expiryDate = new Date(expiryTime);
  const diffMs = expiryDate.getTime() - now.getTime();
  const remainingHours = Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10);

  let urgencyLevel = "LOW";
  let urgencyScore = 20;

  if (remainingHours <= 0) {
    urgencyLevel = "CRITICAL";
    urgencyScore = 100;
  } else if (remainingHours <= 2) {
    urgencyLevel = "CRITICAL";
    urgencyScore = 95;
  } else if (remainingHours <= 5) {
    urgencyLevel = "HIGH";
    urgencyScore = 80;
  } else if (remainingHours <= 12) {
    urgencyLevel = "MEDIUM";
    urgencyScore = 55;
  } else {
    urgencyLevel = "LOW";
    urgencyScore = 25;
  }

  // Adjust score based on perishability of category
  if (["COOKED_MEALS", "DAIRY"].includes(category)) {
    urgencyScore = Math.min(100, urgencyScore + 10);
  }

  // Food safety handling advice
  let safetyRecommendation = "Keep food properly covered and stored at safe temperatures.";
  if (category === "COOKED_MEALS") {
    if (storageCondition === "ROOM_TEMPERATURE") {
      safetyRecommendation =
        "Consume or refrigerate within 2 hours of preparation. Reheat to at least 75°C before serving.";
    } else if (storageCondition === "REFRIGERATED") {
      safetyRecommendation = "Keep chilled under 4°C. Maintain cold chain during transit.";
    }
  } else if (category === "DAIRY") {
    safetyRecommendation = "Must be transported and stored below 4°C to prevent bacterial growth.";
  } else if (category === "FRUITS_VEGETABLES") {
    safetyRecommendation = "Inspect for freshness; wash thoroughly before distribution.";
  } else if (category === "RAW_GROCERY" || category === "PACKAGED_FOOD") {
    safetyRecommendation = "Check packaging integrity and manufacturer best-before labels.";
  }

  // Calculate environmental and social impact
  const impact = calculateFoodImpact({ quantity, unit, category });

  return {
    remainingHours,
    urgencyLevel,
    urgencyScore,
    safetyRecommendation,
    ...impact,
  };
};

/**
 * Calculate Environmental & Social Impact of rescued food
 * Reference standard metrics (FAO / EPA food waste diversion):
 * - 1 meal ≈ 0.4 kg
 * - Rescuing 1 kg of food avoids ~2.5 kg of CO2e greenhouse gas emission
 * - Rescuing 1 kg of food saves ~1,000 liters of embedded agricultural water
 */
const calculateFoodImpact = ({ quantity, unit }) => {
  let estimatedKg = 0;
  let estimatedMeals = 0;

  const numQty = Number(quantity) || 0;

  switch (unit) {
    case "KG":
      estimatedKg = numQty;
      estimatedMeals = Math.round(numQty / 0.4);
      break;
    case "MEALS":
    case "PORTIONS":
      estimatedMeals = numQty;
      estimatedKg = Math.round(numQty * 0.4 * 10) / 10;
      break;
    case "PACKETS":
    case "BOXES":
      estimatedMeals = numQty;
      estimatedKg = Math.round(numQty * 0.5 * 10) / 10;
      break;
    case "LITERS":
      estimatedKg = numQty;
      estimatedMeals = Math.round(numQty / 0.35);
      break;
    default:
      estimatedKg = numQty;
      estimatedMeals = numQty;
  }

  const co2eSavedKg = Math.round(estimatedKg * 2.5 * 10) / 10;
  const waterSavedLiters = Math.round(estimatedKg * 1000);

  return {
    estimatedKg,
    estimatedMeals,
    co2eSavedKg,
    waterSavedLiters,
  };
};

/**
 * Match a Food Listing with the best nearby NGOs
 */
const matchListingWithNgos = (listing, ngos) => {
  if (!ngos || ngos.length === 0) return [];

  const listingLat = listing.pickupLocation?.latitude;
  const listingLon = listing.pickupLocation?.longitude;
  const requiredMeals = listing.servingsEstimated || listing.quantity || 1;

  const matches = ngos
    .map((ngo) => {
      const ngoLat = ngo.location?.latitude;
      const ngoLon = ngo.location?.longitude;

      let distanceKm = null;
      let distanceScore = 50; // Default when coordinates missing

      if (listingLat && listingLon && ngoLat && ngoLon) {
        distanceKm = calculateDistanceKm(listingLat, listingLon, ngoLat, ngoLon);
        // Distance scoring: closer is higher (100 within 2km, decays up to 30km)
        distanceScore = Math.max(0, Math.min(100, Math.round(100 - distanceKm * 3)));
      }

      // Capacity scoring: how well does NGO's daily capacity match listing?
      const capacity = ngo.capacityPerDay || 100;
      let capacityScore = 70;
      if (capacity >= requiredMeals) {
        capacityScore = 95;
      } else {
        capacityScore = Math.max(30, Math.round((capacity / requiredMeals) * 90));
      }

      // Verification score bonus
      const verificationBonus = ngo.verificationStatus === "APPROVED" ? 10 : 0;

      // Combined Match Score (0 - 100)
      const overallMatchScore = Math.min(
        100,
        Math.round(distanceScore * 0.55 + capacityScore * 0.35 + verificationBonus)
      );

      return {
        ngoId: ngo._id,
        name: ngo.name,
        phone: ngo.phone,
        address: ngo.address,
        distanceKm,
        capacityPerDay: ngo.capacityPerDay,
        verificationStatus: ngo.verificationStatus,
        matchScore: overallMatchScore,
        matchReason:
          distanceKm !== null
            ? `Located ${distanceKm} km away with capacity for ${capacity} meals/day.`
            : `Compatible capacity for ${capacity} meals/day.`,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return matches;
};

module.exports = {
  calculateDistanceKm,
  analyzeFoodUrgencyAndSafety,
  calculateFoodImpact,
  matchListingWithNgos,
};
