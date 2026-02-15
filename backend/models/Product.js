const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, default: "" },
  price: { type: Number, required: true },
  desc: { type: String },
  image: { type: String },
  reviews: Array,
  
  // 🟢 NEW: Active Status
  isActive: { type: Boolean, default: true } 
});

module.exports = mongoose.model('Product_cafex', productSchema);