require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Organization = require("../models/Organization");

const seedAdminAndNgo = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI not configured in .env");
    }

    console.log("[Setup] Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[Setup] Connected successfully.");

    const hashedPassword = await bcrypt.hash("Password123!", 12);

    // ==========================================
    // 1. ADMIN USER
    // ==========================================
    let admin = await User.findOne({ email: "admin@foodrescue.org" });
    if (!admin) {
      admin = await User.create({
        name: "Head Administrator",
        email: "admin@foodrescue.org",
        password: hashedPassword,
        phone: "+919876543210",
        role: "admin",
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      console.log("✓ Created Admin: admin@foodrescue.org");
    } else {
      admin.role = "admin";
      admin.password = hashedPassword;
      admin.isEmailVerified = true;
      await admin.save();
      console.log("✓ Updated/Verified Admin: admin@foodrescue.org");
    }

    // ==========================================
    // 2. NGO 1: Helping Hands Orphanage & Shelter
    // ==========================================
    let ngoUser1 = await User.findOne({ email: "helpinghands@ngo.org" });
    if (!ngoUser1) {
      ngoUser1 = await User.create({
        name: "Priya Verma (Director)",
        email: "helpinghands@ngo.org",
        password: hashedPassword,
        phone: "+919876543212",
        role: "ngo",
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      console.log("✓ Created NGO User: helpinghands@ngo.org");
    } else {
      ngoUser1.role = "ngo";
      ngoUser1.password = hashedPassword;
      ngoUser1.isEmailVerified = true;
      await ngoUser1.save();
      console.log("✓ Updated/Verified NGO User: helpinghands@ngo.org");
    }

    let ngoOrg1 = await Organization.findOne({ email: "helpinghands@ngo.org" });
    if (!ngoOrg1) {
      ngoOrg1 = await Organization.create({
        name: "Helping Hands Orphanage & Shelter",
        type: "NGO",
        owner: ngoUser1._id,
        description: "Community child shelter providing housing, nutrition, and education to orphaned children.",
        address: {
          street: "Plot 14, Aliganj Sector C",
          city: "Lucknow",
          state: "Uttar Pradesh",
          pincode: "226024",
        },
        location: {
          latitude: 26.8921,
          longitude: 80.9412,
        },
        phone: "+919876543212",
        email: "helpinghands@ngo.org",
        capacityPerDay: 150,
        verificationStatus: "APPROVED",
        operatingHours: { open: "08:00", close: "21:00" },
      });
      console.log("✓ Created NGO Org: Helping Hands Orphanage (Aliganj)");
    } else {
      ngoOrg1.owner = ngoUser1._id;
      ngoOrg1.verificationStatus = "APPROVED";
      await ngoOrg1.save();
      console.log("✓ Verified NGO Org: Helping Hands Orphanage");
    }

    ngoUser1.organization = ngoOrg1._id;
    await ngoUser1.save();

    // ==========================================
    // 3. NGO 2: Lucknow Roti Bank & Hunger Relief
    // ==========================================
    let ngoUser2 = await User.findOne({ email: "rotibank@ngo.org" });
    if (!ngoUser2) {
      ngoUser2 = await User.create({
        name: "Amit Srivastava (Coordinator)",
        email: "rotibank@ngo.org",
        password: hashedPassword,
        phone: "+919876543215",
        role: "ngo",
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      console.log("✓ Created NGO User: rotibank@ngo.org");
    } else {
      ngoUser2.role = "ngo";
      ngoUser2.password = hashedPassword;
      ngoUser2.isEmailVerified = true;
      await ngoUser2.save();
      console.log("✓ Updated/Verified NGO User: rotibank@ngo.org");
    }

    let ngoOrg2 = await Organization.findOne({ email: "rotibank@ngo.org" });
    if (!ngoOrg2) {
      ngoOrg2 = await Organization.create({
        name: "Lucknow Roti Bank & Community Kitchen",
        type: "NGO",
        owner: ngoUser2._id,
        description: "Youth volunteer network serving fresh meals to patients and daily wage workers across hospitals.",
        address: {
          street: "Near KGMU Chowk & Hazratganj",
          city: "Lucknow",
          state: "Uttar Pradesh",
          pincode: "226001",
        },
        location: {
          latitude: 26.8680,
          longitude: 80.9180,
        },
        phone: "+919876543215",
        email: "rotibank@ngo.org",
        capacityPerDay: 300,
        verificationStatus: "APPROVED",
        operatingHours: { open: "07:00", close: "23:00" },
      });
      console.log("✓ Created NGO Org: Lucknow Roti Bank (Hazratganj/Chowk)");
    } else {
      ngoOrg2.owner = ngoUser2._id;
      ngoOrg2.verificationStatus = "APPROVED";
      await ngoOrg2.save();
      console.log("✓ Verified NGO Org: Lucknow Roti Bank");
    }

    ngoUser2.organization = ngoOrg2._id;
    await ngoUser2.save();

    console.log("\n=======================================================");
    console.log("Accounts Successfully Registered and Active in Database!");
    console.log("-------------------------------------------------------");
    console.log("1. Admin:   admin@foodrescue.org       / Password123!");
    console.log("2. NGO 1:   helpinghands@ngo.org       / Password123!");
    console.log("3. NGO 2:   rotibank@ngo.org           / Password123!");
    console.log("=======================================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("[Setup Error]", err.message);
    process.exit(1);
  }
};

seedAdminAndNgo();
