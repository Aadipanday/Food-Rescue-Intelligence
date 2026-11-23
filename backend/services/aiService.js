/**
 * AnnaSetu Intelligence - AI Service Engine
 * Provides smart analytics, urgency scoring, NGO matching, and environmental impact computation.
 */

const axios = require("axios");

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

  // Calculate age since preparation/cooking
  let hoursSinceCooked = null;
  if (cookedTime) {
    const cookedDate = new Date(cookedTime);
    if (!isNaN(cookedDate.getTime())) {
      hoursSinceCooked = Math.max(0, Math.round(((now.getTime() - cookedDate.getTime()) / (1000 * 60 * 60)) * 10) / 10);
    }
  }

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

  // Adjust score based on perishability of category and elapsed cooked time
  if (["COOKED_MEALS", "DAIRY"].includes(category)) {
    urgencyScore = Math.min(100, urgencyScore + 10);
    // If cooked meals have been sitting at ambient/room temp for > 2 hours, elevate urgency!
    if (hoursSinceCooked !== null && hoursSinceCooked >= 2 && storageCondition === "ROOM_TEMPERATURE") {
      urgencyScore = Math.min(100, urgencyScore + 15);
      if (urgencyLevel === "MEDIUM") urgencyLevel = "HIGH";
      if (urgencyLevel === "HIGH" && hoursSinceCooked >= 3.5) urgencyLevel = "CRITICAL";
    }
  }

  // Food safety handling advice based on preparation time & temperature (FSSAI 2-hr/4-hr rule)
  let safetyRecommendation = "Keep food properly covered and stored at safe temperatures.";
  if (category === "COOKED_MEALS") {
    if (storageCondition === "ROOM_TEMPERATURE" || storageCondition === "Ambient Room Temperature") {
      if (hoursSinceCooked !== null && hoursSinceCooked >= 3) {
        safetyRecommendation = `⚠️ Prepared ~${hoursSinceCooked}h ago at room temperature. Under FSSAI 2-hr/4-hr rule, rapid dispatch or reheating to >75°C is required before serving.`;
      } else {
        safetyRecommendation = "Consume or refrigerate within 2 hours of preparation. Reheat to at least 75°C before serving.";
      }
    } else if (storageCondition === "REFRIGERATED" || storageCondition === "Refrigerated (<4°C)") {
      safetyRecommendation = "Keep chilled under 4°C. Maintain unbroken cold chain during transit.";
    } else if (storageCondition === "HOT_HOLDING" || storageCondition === "Hot Food Warm (>65°C)") {
      safetyRecommendation = "Maintain hot holding above 65°C in insulated vessels to inhibit bacterial proliferation.";
    }
  } else if (category === "DAIRY") {
    safetyRecommendation = "Must be transported and stored below 4°C to prevent bacterial growth.";
  } else if (category === "FRUITS_VEGETABLES" || category === "RAW_PRODUCE") {
    safetyRecommendation = "Inspect for freshness; wash thoroughly before distribution.";
  } else if (category === "RAW_GROCERY" || category === "PACKAGED_FOOD") {
    safetyRecommendation = "Check packaging integrity and manufacturer best-before labels.";
  }

  // Calculate environmental and social impact
  const impact = calculateFoodImpact({ quantity, unit, category });

  return {
    remainingHours,
    hoursSinceCooked,
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

/**
 * Gemini AI Vision Food Analysis
 * Inspects food surplus photography using Google Gemini Multimodal Vision API
 */
const analyzeFoodImageWithGemini = async ({ imageBase64, mimeType = "image/jpeg" }) => {
  let cleanBase64 = imageBase64 || "";
  let resolvedMime = mimeType;

  // Handle data URL prefix if present: e.g. "data:image/jpeg;base64,...."
  if (cleanBase64.includes(";base64,")) {
    const parts = cleanBase64.split(";base64,");
    const mimeMatch = parts[0].match(/data:(image\/[a-zA-Z0-9.+_-]+)/);
    if (mimeMatch) resolvedMime = mimeMatch[1];
    cleanBase64 = parts[1];
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!cleanBase64) {
    throw new Error("No image data provided for Gemini AI vision inspection.");
  }

  if (apiKey) {
    const promptText = `You are a certified senior Food Safety & Rescue Inspector for the 'AnnaSetu Intelligence' zero-hunger network.
Analyze this food photograph with rigorous accuracy.

CRITICAL CLASSIFICATION & PERISHABILITY RULES:
1. RAW UNCOOKED STAPLES & DRY PANTRY (e.g. uncooked dry rice grains, wheat, flour, lentils/dal, dry pulses, spices, sugar, cooking oil, salt, sealed dry food):
   - category MUST be 'RAW_GROCERY'
   - title: clear title indicating raw/dry staple (e.g. 'Raw White Rice Grains (Dry Pantry)')
   - dietaryType: 'VEG'
   - unit: 'KG' or 'PACKETS'
   - recommendedStorage: 'Room Temperature (Dry / Pantry)'
   - suggestedUrgencyHours: 72 (Non-perishable! Safe for months/years if dry. Do NOT assign short cooked-food hours!)
   - visualObservation: Note that it is uncooked/dry, describe grain quality, packaging, moisture signs.

2. FRESH PRODUCE (whole fresh fruits, raw raw vegetables, greens):
   - category MUST be 'FRUITS_VEGETABLES'
   - unit: 'KG'
   - recommendedStorage: 'Ambient / Cool Dry Place' or 'Refrigerated (<4°C)'
   - suggestedUrgencyHours: 24 to 48 hours

3. BAKERY & BREADS (loaf bread, buns, rotis, pastries, biscuits):
   - category MUST be 'BAKERY'
   - unit: 'PACKETS' or 'MEALS'
   - recommendedStorage: 'Room Temperature (Dry)'
   - suggestedUrgencyHours: 12 to 24 hours

4. DAIRY (fresh milk, paneer, curd, cheese):
   - category MUST be 'DAIRY'
   - unit: 'LITERS' or 'KG'
   - recommendedStorage: 'Refrigerated (<4°C)'
   - suggestedUrgencyHours: 6 to 12 hours

5. PACKAGED & CANNED GOODS (sealed boxes, cans, sealed containers):
   - category MUST be 'PACKAGED_FOOD'
   - unit: 'PACKETS' or 'BOXES'
   - recommendedStorage: 'Ambient / Room Temperature'
   - suggestedUrgencyHours: 48 to 72 hours

6. PREPARED & COOKED MEALS (hot buffet, cooked rice, dal makhani, curry, gravies, cooked snacks, catering trays):
   - category MUST be 'COOKED_MEALS'
   - unit: 'MEALS'
   - recommendedStorage: 'Hot Food Warm (>65°C)' or 'Refrigerated (<4°C)'
   - suggestedUrgencyHours: 2 to 4 hours (Perishable! Must be consumed or rescued quickly!)

Output ONLY a raw JSON object (no markdown, no backticks, no code fences) with this exact schema:
{
  "title": "Descriptive title of the food item",
  "description": "2-3 sentences explaining observable items, state (raw dry vs freshly cooked), container/packaging, and apparent freshness.",
  "category": "one of: COOKED_MEALS, RAW_GROCERY, BAKERY, FRUITS_VEGETABLES, DAIRY, PACKAGED_FOOD, BEVERAGES",
  "dietaryType": "one of: VEG, NON_VEG, VEGAN",
  "estimatedQuantity": integer (e.g. 10 kg, 30 meals, 15 packets),
  "unit": "one of: MEALS, KG, PACKETS, BOXES, LITERS",
  "freshnessScore": integer 70-99 assessing visual quality,
  "visualObservation": "Detailed observation of food state, packaging, and hygiene signs.",
  "packagingType": "one of: BULK_VESSELS, INDIVIDUAL_BOXES, SEALED_PACKETS, DRY_SACKS",
  "recommendedStorage": "one of: Room Temperature (Dry / Pantry), Hot Food Warm (>65°C), Refrigerated (<4°C), Ambient / Cool Dry Place",
  "suggestedUrgencyHours": integer recommended pickup deadline in hours,
  "ingredientsDetected": ["array", "of", "items"]
}`;

    // Available Gemini multimodal vision models in priority order
    const candidateModels = [
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-3-flash-preview",
      "gemini-flash-latest",
    ];

    let lastError = null;

    for (const model of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await axios.post(
          endpoint,
          {
            contents: [
              {
                parts: [
                  { text: promptText },
                  {
                    inline_data: {
                      mime_type: resolvedMime,
                      data: cleanBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              response_mime_type: "application/json",
            },
          },
          { timeout: 20000 }
        );

        const candidateText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const cleanedJson = candidateText.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanedJson);

          const impact = calculateFoodImpact({
            quantity: parsed.estimatedQuantity || 25,
            unit: parsed.unit || "MEALS",
            category: parsed.category || "COOKED_MEALS",
          });

          return {
            ...parsed,
            ...impact,
            aiPowered: true,
            provider: `Google Gemini Vision (${model})`,
            confidenceScore: 98,
          };
        }
      } catch (apiError) {
        lastError = apiError.response?.data?.error?.message || apiError.message;
        console.warn(`Model ${model} attempt failed:`, lastError);
      }
    }

    // If API key was provided but failed across all models, return explicit error
    throw new Error(`Google Gemini Vision API request failed: ${lastError}`);
  }

  // If no API key configured in .env at all
  throw new Error("GEMINI_API_KEY is missing in backend/.env. Please add your key from https://aistudio.google.com/apikey");
};

/**
 * Smart Heuristic Fallback Parser for Natural Language Food Descriptions
 */
const parseFoodPromptHeuristic = (text) => {
  const lower = text.toLowerCase();

  // Extract quantities and units (e.g. "5 kg", "10kg", "50 meals", "20 packets")
  // Exclude numbers immediately followed by time indicators (e.g. "1 ghante", "2 hours", "30 mins")
  let totalQty = 0;
  let unit = "MEALS";
  const qtyMatches = [...lower.matchAll(/(\d+(?:\.\d+)?)\s*(kg|kilo|kilos|meals|servings|plates|packets|packet|boxes|box|liters|liter|l|ghant\w*|hour\w*|hr\w*|min\w*|baje)?/gi)];
  
  if (qtyMatches.length > 0) {
    let hasKg = false;
    let hasPackets = false;
    for (const match of qtyMatches) {
      const num = parseFloat(match[1]);
      const u = (match[2] || "").toLowerCase();
      // Skip if this number is a time duration (e.g. 1 ghante pehle, 2 hours ago)
      if (u.startsWith("ghant") || u.startsWith("hour") || u.startsWith("hr") || u.startsWith("min") || u === "baje") {
        continue;
      }
      if (!isNaN(num) && num > 0) totalQty += num;
      if (u.includes("kg") || u.includes("kilo")) hasKg = true;
      if (u.includes("packet") || u.includes("box")) hasPackets = true;
    }
    if (hasKg) unit = "KG";
    else if (hasPackets) unit = "PACKETS";
  }
  if (totalQty === 0) totalQty = 25;

  // Clues for category
  let category = "COOKED_MEALS";
  if (lower.includes("kaccha") || lower.includes("raw") || lower.includes("dry") || lower.includes("gehu") || lower.includes("atta")) {
    category = "RAW_GROCERY";
  } else if (lower.includes("bread") || lower.includes("bun") || lower.includes("bakery") || lower.includes("cake") || lower.includes("puff")) {
    category = "BAKERY";
  } else if (lower.includes("milk") || lower.includes("doodh") || lower.includes("curd") || lower.includes("dahi")) {
    category = "DAIRY";
  }

  // Detect food dishes to build smart title
  const detectedDishes = [];
  if (lower.includes("daal") || lower.includes("dal")) detectedDishes.push("Dal");
  if (lower.includes("chawal") || lower.includes("rice")) detectedDishes.push("Chawal/Rice");
  if (lower.includes("roti") || lower.includes("phulka") || lower.includes("chapati")) detectedDishes.push("Rotis");
  if (lower.includes("paneer")) detectedDishes.push("Paneer");
  if (lower.includes("sabzi") || lower.includes("curry")) detectedDishes.push("Sabzi");
  if (lower.includes("pulao") || lower.includes("biryani")) detectedDishes.push("Biryani/Pulao");
  if (lower.includes("bread") || lower.includes("sandwich")) detectedDishes.push("Sandwiches/Bread");

  let cleanTitle = detectedDishes.length > 0 
    ? `Fresh ${detectedDishes.join(" & ")} (${Math.round(totalQty)} ${unit})`
    : text.slice(0, 50).trim();
  cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  // Clues for dietary
  let dietaryType = "VEG";
  if (lower.includes("chicken") || lower.includes("mutton") || lower.includes("non-veg") || lower.includes("egg") || lower.includes("anda") || lower.includes("fish")) {
    dietaryType = "NON_VEG";
  }

  // Clues for storage & temperature
  let storageCondition = "Ambient Room Temp";
  if (lower.includes("garam") || lower.includes("hot") || lower.includes("warm")) {
    storageCondition = "Hot Food Warm (>65°C)";
  } else if (lower.includes("fridge") || lower.includes("freeze") || lower.includes("thanda") || lower.includes("chilled")) {
    storageCondition = "Refrigerated (<4°C)";
  }

  // Clues for time cooked
  let cookedTimeMode = "JUST_COOKED";
  let idealPickupHours = 3;
  if (lower.includes("1 ghant") || lower.includes("1 hour") || lower.includes("aadha") || lower.includes("half hour") || lower.includes("fresh") || lower.includes("abhi")) {
    cookedTimeMode = "JUST_COOKED";
    idealPickupHours = 3;
  } else if (lower.includes("2 ghant") || lower.includes("2 hour") || lower.includes("3 ghant") || lower.includes("3 hour")) {
    cookedTimeMode = "2_HOURS_AGO";
    idealPickupHours = 2;
  } else if (lower.includes("subah") || lower.includes("morning") || lower.includes("5 ghant") || lower.includes("6 hour")) {
    cookedTimeMode = "MORNING";
    idealPickupHours = 4;
  } else if (category === "RAW_GROCERY") {
    cookedTimeMode = "DRY_STAPLE";
    idealPickupHours = 72;
  }

  // Clues for packaging
  let packagingType = "BULK_VESSELS";
  if (lower.includes("box") || lower.includes("dabba") || lower.includes("packet") || lower.includes("pack")) {
    packagingType = "INDIVIDUAL_BOXES";
  } else if (category === "RAW_GROCERY" || lower.includes("bori") || lower.includes("sack")) {
    packagingType = "DRY_SACKS";
  }

  return {
    title: cleanTitle,
    description: `Surplus food extracted from voice/text: "${text}"`,
    category,
    dietaryType,
    quantity: Math.round(totalQty),
    unit,
    cookedTimeMode,
    storageCondition,
    packagingType,
    idealPickupHours,
    allergens: category === "DAIRY" || lower.includes("paneer") ? ["DAIRY"] : [],
    summary: `Extracted: ~${Math.round(totalQty)} ${unit} (${dietaryType}) • Storage: ${storageCondition} • Cooked: ${cookedTimeMode}`,
    aiPowered: true,
    provider: "Smart Natural Language AI Parser",
  };
};

/**
 * Natural Language Food Rescue Prompt Parser
 * Extracts structured listing details from casual conversational English, Hindi, or Hinglish text
 * e.g., "5 kg daal aur 10kg chawala bache hai room me rakhe hai 1 ghante phle bne the"
 */
const parseFoodPromptWithGemini = async ({ promptText }) => {
  if (!promptText || !promptText.trim()) {
    throw new Error("Please provide a food description prompt to analyze.");
  }

  const cleanText = promptText.trim();
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    const systemPrompt = `You are an expert AI Food Rescue Assistant for an Indian zero-hunger logistics network.
The user is describing surplus food in natural, informal English, Hindi, or Hinglish (e.g. "5 kg daal aur 10kg chawala bache hai room me rakhe hai 1 ghante phle bne the", or "hostel mess 60 portions lunch dal rice bacha hai").

Extract and return a strict JSON object with these exact fields:
{
  "title": "Clear concise title of food items (e.g. '5 kg Dal aur 10 kg Chawal' or 'Hostel Mess Lunch - Dal & Rice')",
  "description": "Short 1-2 sentence description including observable state and storage condition",
  "category": "one of: COOKED_MEALS, RAW_GROCERY, BAKERY, FRUITS_VEGETABLES, DAIRY, PACKAGED_FOOD, BEVERAGES",
  "dietaryType": "one of: VEG, NON_VEG, VEGAN, JAIN",
  "quantity": integer total quantity (e.g. sum of 5 + 10 = 15, or 60 meals),
  "unit": "one of: MEALS, KG, PACKETS, BOXES, LITERS",
  "cookedTimeMode": "one of: JUST_COOKED (if <1 hr), 2_HOURS_AGO (if 2-3 hrs), 4_HOURS_AGO, MORNING (if morning/breakfast), DRY_STAPLE (if uncooked rice/pulses)",
  "storageCondition": "one of: Hot Food Warm (>65°C), Refrigerated (<4°C), Ambient Room Temp, Deep Frozen (<-18°C)",
  "packagingType": "one of: BULK_VESSELS, INDIVIDUAL_BOXES, SEALED_PACKETS, DRY_SACKS",
  "idealPickupHours": integer recommended urgency hours (e.g. 2, 3, 4, 6, 24, 72),
  "allergens": ["array", "of", "detected", "allergens", "like", "DAIRY", "GLUTEN"],
  "summary": "Short 1-line confirmation of what AI understood (e.g. 'Extracted 15 kg cooked Dal & Chawal, Ambient storage, prepared 1h ago.')"
}

Output ONLY valid raw JSON without markdown formatting or code blocks.`;

    const candidateModels = [
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-3-flash-preview",
      "gemini-flash-latest",
    ];

    for (const model of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await axios.post(
          endpoint,
          {
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: `User surplus description: "${cleanText}"` },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              response_mime_type: "application/json",
            },
          },
          { timeout: 15000 }
        );

        const candidateText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const cleanedJson = candidateText.replace(/```json/gi, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanedJson);
          return {
            ...parsed,
            aiPowered: true,
            provider: `Google Gemini AI (${model})`,
          };
        }
      } catch (err) {
        console.warn(`Prompt parse model ${model} failed, trying next...`, err.message);
      }
    }
  }

  // Smart Heuristic Fallback (Runs if offline or Gemini API is unreachable)
  return parseFoodPromptHeuristic(cleanText);
};

module.exports = {
  calculateDistanceKm,
  analyzeFoodUrgencyAndSafety,
  calculateFoodImpact,
  matchListingWithNgos,
  analyzeFoodImageWithGemini,
  parseFoodPromptWithGemini,
};
