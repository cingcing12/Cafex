const mongoose = require("mongoose");
const PendingUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String, // In production, this should be hashed!
  otp: String,
  image: String,
  createdAt: { type: Date, default: Date.now, index: { expires: "5m" } }, // Auto-delete after 5 mins
});
module.exports = mongoose.model("PendingUser_cafex", PendingUserSchema);
