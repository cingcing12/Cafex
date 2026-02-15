// backend/seedAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    // 1. Check if admin exists
    const existingAdmin = await User.findOne({ email: "admin@cafex.com" });
    if (existingAdmin) {
      console.log("⚠️ Admin already exists!");
      process.exit();
    }

    // 2. Create new Admin
    const admin = new User({
      name: "Super Admin",
      email: "admin@cafex.com",
      phone: "012345678",
      password: "123", // In a real app, hash this!
      role: "admin",
      image: "https://via.placeholder.com/150",
      savedCart: [],
      savedWishlist: []
    });

    await admin.save();
    console.log("🎉 Admin Created Successfully!");
    console.log("📧 Email: admin@cafex.com");
    console.log("🔑 Password: 123");
    
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });