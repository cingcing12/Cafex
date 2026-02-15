const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: { type: String, default: "Guest" },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { timestamps: true, collection: 'reviews_cafex' });

module.exports = mongoose.model("Review_cafex", reviewSchema);