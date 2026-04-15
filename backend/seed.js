const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const connectDB = require("./src/config/db");
const { Settings } = require("./src/models/settingsModel");
const { Portal } = require("./src/models/portalModel");
const { User } = require("./src/models/userModel");

const seedData = async () => {
  await connectDB();

  console.log("Seeding started...");

  // Default Settings
  const settings = await Settings.find();
  if (settings.length === 0) {
    await Settings.create({
      cc_charge_percentage: 2.50,
      bill_charge_percentage: 3.50,
      branch_manager_share_percentage: 30.00,
      head_manager_share_percentage: 70.00,
    });
    console.log("Settings seeded");
  }

  // Default Portal
  const portals = await Portal.find();
  if (portals.length === 0) {
    await Portal.create({ name: "Portal A", charge_percentage: 1.00 });
    console.log("Portal seeded");
  }

  // Default Admin User
  const users = await User.find({ email: "admin@cashflow.com" });
  if (users.length === 0) {
    await User.create({
      name: "Administrator",
      email: "admin@cashflow.com",
      // password: Admin@123
      password: "$2a$10$E9rddXQiG2yEQ4SaGju3BeQlyGP7MYuaVXdnNQFO1Of6h6LnRqlEO",
      role: "admin",
    });
    console.log("Admin user seeded");
  }

  console.log("Seeding complete!");
  process.exit();
};

seedData();
