const mongoose = require("mongoose");

const pendingOrderSchema = new mongoose.Schema({
  billNumber: String,
  md5: String,
  qrString: String, // The Bakong raw QR string
  amount: Number,
  customer: Object,
  items: Array,
  
  // 🟢 CRITICAL UPDATES: Added these fields to match your app.js logic
  deliveryStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryStaff' },
  landmark: { type: String, default: "" },
  qrCodeData: String, // The internal QR image (Data URL)
  
  createdAt: { type: Date, default: Date.now, expires: 600 } // Auto-delete after 10 mins if not paid
});

module.exports = mongoose.model("PendingOrder_cafex", pendingOrderSchema);