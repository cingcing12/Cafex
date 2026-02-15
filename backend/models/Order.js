const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  billNumber: String,
  amount: Number,
  paymentMethod: String, 
  paymentStatus: { type: String, default: "Unpaid" },
  deliveryStatus: { type: String, default: "Pending" },
  
  customer: {
    name: String,
    phone: String,
    address: String, // Manual Text Address
    email: String,
    telegramUsername: String // 🟢 NEW: For driver contact
  },
  
  items: Array,
  createdAt: { type: Date, default: Date.now },
  
  // Staff Assignment
  deliveryStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryStaff' },
  
  landmark: String, // "Near the red gate"
  
  qrCodeData: { type: String }
}, { collection: 'order_cafex' });

module.exports = mongoose.model("Order", orderSchema);