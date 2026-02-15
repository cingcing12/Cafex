const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true }, // e.g. "Protein Beverages"
  image: { type: String, default: "" },
  
  // 👇 NEW FIELDS
  group: { type: String, default: "Drinks" }, // e.g. "Drinks", "Food"
  subcategories: { type: [String], default: [] } // List of sub-headers
});

module.exports = mongoose.model('Category_cafex', categorySchema);