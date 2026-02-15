const mongoose = require("mongoose");

const deliveryStaffSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // 🟢 Login Password
  email: String,
  telegramUsername: String,
  vehicleType: String, 
  image: { type: String, default: "https://cdn-icons-png.flaticon.com/512/1995/1995515.png" }, // 🟢 Profile Pic
  status: { type: String, default: "Active" },
  rating: { type: Number, default: 5.0 }, // 🟢 Star Rating
  ratingCount: { type: Number, default: 0 }
}, { collection: 'delivery_staff' });

module.exports = mongoose.model("DeliveryStaff", deliveryStaffSchema);