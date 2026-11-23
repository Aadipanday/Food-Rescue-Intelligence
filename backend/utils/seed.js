require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Organization = require("../models/Organization");
const FoodListing = require("../models/FoodListing");
const FoodClaim = require("../models/FoodClaim");
const { analyzeFoodUrgencyAndSafety } = require("../services/aiService");

const seedDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not found in environment.");
    }

    console.log("[Seed] Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[Seed] Connected.");

    // Clean existing test data (safe: only deletes seed-created accounts)
    console.log("[Seed] Cleaning previous seed data...");
    await User.deleteMany({
      email: {
        $in: [
          "admin@foodrescue.org",
          "canteen@ietlucknow.ac.in",
          "helpinghands@ngo.org",
        ],
      },
    });

    const hashedPassword = await bcrypt.hash("Password123!", 12);

    // 1. Create Admin User
    const adminUser = await User.create({
      name: "System Admin",
      email: "admin@foodrescue.org",
      password: hashedPassword,
      phone: "+919876543210",
      role: "admin",
      isEmailVerified: true,
      isPhoneVerified: true,
    });
    console.log("[Seed] Created Admin User: admin@foodrescue.org");

    // 2. Create Food Provider (Donor) User & Organization
    const donorUser = await User.create({
      name: "Rahul Sharma (Campus Canteen)",
      email: "canteen@ietlucknow.ac.in",
      password: hashedPassword,
      phone: "+919876543211",
      role: "donor",
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    const donorOrg = await Organization.create({
      name: "IET Central Canteen",
      type: "FOOD_PROVIDER",
      owner: donorUser._id,
      description: "University central dining hall providing daily meals to students and faculty.",
      address: {
        street: "Sitapur Road, Sector F, Jankipuram",
        city: "Lucknow",
        state: "Uttar Pradesh",
        pincode: "226021",
      },
      location: {
        latitude: 26.9148,
        longitude: 80.9424,
      },
      phone: "+919876543211",
      email: "canteen@ietlucknow.ac.in",
      capacityPerDay: 500,
      verificationStatus: "APPROVED",
      operatingHours: { open: "07:00", close: "22:00" },
    });

    donorUser.organization = donorOrg._id;
    await donorUser.save();
    console.log("[Seed] Created Donor & Organization: IET Central Canteen (Lucknow)");

    // 3. Create NGO (Recipient) User & Organization
    const ngoUser = await User.create({
      name: "Priya Verma",
      email: "helpinghands@ngo.org",
      password: hashedPassword,
      phone: "+919876543212",
      role: "ngo",
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    const ngoOrg = await Organization.create({
      name: "Helping Hands Orphanage & Shelter",
      type: "NGO",
      owner: ngoUser._id,
      description: "Community child shelter providing housing, nutrition, and education.",
      address: {
        street: "Aliganj Sector C",
        city: "Lucknow",
        state: "Uttar Pradesh",
        pincode: "226024",
      },
      location: {
        latitude: 26.8921,
        longitude: 80.9412, // ~2.5 km from IET
      },
      phone: "+919876543212",
      email: "helpinghands@ngo.org",
      capacityPerDay: 150,
      verificationStatus: "APPROVED",
      operatingHours: { open: "08:00", close: "20:00" },
    });

    ngoUser.organization = ngoOrg._id;
    await ngoUser.save();
    console.log("[Seed] Created NGO & Organization: Helping Hands (Lucknow)");

    // 4. Create Active Food Listings
    const now = new Date();
    const expiryDate1 = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours left
    const expiryDate2 = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours left

    const analysis1 = analyzeFoodUrgencyAndSafety({
      category: "COOKED_MEALS",
      foodType: "VEG",
      quantity: 40,
      unit: "MEALS",
      storageCondition: "ROOM_TEMPERATURE",
      expiryTime: expiryDate1,
      cookedTime: now,
    });

    const listing1 = await FoodListing.create({
      title: "Fresh Dal Makhani, Paneer & Rice",
      description: "Surplus lunch buffet preparation, kept hot and hygienically packed in covered containers.",
      category: "COOKED_MEALS",
      foodType: "VEG",
      quantity: 40,
      unit: "MEALS",
      cookedTime: now,
      expiryTime: expiryDate1,
      storageCondition: "ROOM_TEMPERATURE",
      urgencyLevel: analysis1.urgencyLevel,
      pickupLocation: {
        street: "Canteen Block A, IET Campus",
        city: "Lucknow",
        state: "Uttar Pradesh",
        pincode: "226021",
        latitude: 26.9148,
        longitude: 80.9424,
      },
      pickupWindow: {
        startTime: now,
        endTime: expiryDate1,
      },
      contactPhone: "+919876543211",
      donor: donorUser._id,
      organization: donorOrg._id,
      status: "AVAILABLE",
      aiAnalysis: {
        urgencyScore: analysis1.urgencyScore,
        estimatedMeals: analysis1.estimatedMeals,
        co2eSavedKg: analysis1.co2eSavedKg,
        waterSavedLiters: analysis1.waterSavedLiters,
        shelfLifeRemainingHours: analysis1.remainingHours,
        safetyRecommendation: analysis1.safetyRecommendation,
      },
    });

    const analysis2 = analyzeFoodUrgencyAndSafety({
      category: "BAKERY",
      foodType: "VEG",
      quantity: 25,
      unit: "PACKETS",
      storageCondition: "ROOM_TEMPERATURE",
      expiryTime: expiryDate2,
      cookedTime: now,
    });

    const listing2 = await FoodListing.create({
      title: "Baked Bread Loaves & Vegetable Sandwiches",
      description: "Morning cafeteria breakfast surplus, individually wrapped in food-grade foil.",
      category: "BAKERY",
      foodType: "VEG",
      quantity: 25,
      unit: "PACKETS",
      cookedTime: now,
      expiryTime: expiryDate2,
      storageCondition: "ROOM_TEMPERATURE",
      urgencyLevel: analysis2.urgencyLevel,
      pickupLocation: {
        street: "Cafeteria Counter 2, IET Campus",
        city: "Lucknow",
        state: "Uttar Pradesh",
        pincode: "226021",
        latitude: 26.9148,
        longitude: 80.9424,
      },
      pickupWindow: {
        startTime: now,
        endTime: expiryDate2,
      },
      contactPhone: "+919876543211",
      donor: donorUser._id,
      organization: donorOrg._id,
      status: "AVAILABLE",
      aiAnalysis: {
        urgencyScore: analysis2.urgencyScore,
        estimatedMeals: analysis2.estimatedMeals,
        co2eSavedKg: analysis2.co2eSavedKg,
        waterSavedLiters: analysis2.waterSavedLiters,
        shelfLifeRemainingHours: analysis2.remainingHours,
        safetyRecommendation: analysis2.safetyRecommendation,
      },
    });

    console.log("[Seed] Created 2 Active Food Listings with AI Analysis & Environmental Impact.");
    console.log("\n=======================================================");
    console.log("Database Seed Successful! Test Credentials:");
    console.log("-------------------------------------------------------");
    console.log("1. Admin:   admin@foodrescue.org       / Password123!");
    console.log("2. Donor:   canteen@ietlucknow.ac.in   / Password123!");
    console.log("3. NGO:     helpinghands@ngo.org       / Password123!");
    console.log("=======================================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("[Seed Error]", error.message);
    process.exit(1);
  }
};

seedDatabase();
