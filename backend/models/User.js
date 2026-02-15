const mongoose = require("mongoose");

// 🔔 Notification Schema
const notificationSchema = new mongoose.Schema({
  id: { type: String, default: () => Date.now().toString() },
  type: { type: String, default: 'alert' }, // 'rating', 'alert', 'delivery'
  title: String,
  message: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  
  // 🟢 CRITICAL UPDATE: Allow storing dynamic data (e.g., staffId, orderId)
  data: { type: mongoose.Schema.Types.Mixed } 
});

// 🛒 Cart Schema
const cartItemSchema = new mongoose.Schema({
  cartId: { type: String }, // Unique ID for the cart item
  
  // ⚠️ Storing BOTH IDs to ensure we can always find it
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Link to Product Model
  id: { type: Number }, // Custom ID from your frontend (e.g. 1738212...)
  
  name: String,       
  image: String,      
  price: Number,      
  quantity: { type: Number, default: 1 },
  isReward: { type: Boolean, default: false },
  options: {
    size: String, sugar: String, ice: String, 
    temperature: String, cutlery: String, 
    note: String
  }
}, { _id: false }); 

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: String,
  password: { type: String, required: true },
  role: { type: String, default: "customer" }, 
  
  savedCart: [cartItemSchema], 
  savedWishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  
  // 🟢 Notifications Array (using the updated schema above)
  notifications: [notificationSchema],
  
  points: { type: Number, default: 0 },
  image: { type: String, default: "" }
}, { 
  collection: 'user_cafex',
  timestamps: true 
});

module.exports = mongoose.model("User", userSchema);