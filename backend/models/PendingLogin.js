const mongoose = require('mongoose');

const PendingLoginSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: { expires: '5m' } } // Auto-delete after 5 mins
});

module.exports = mongoose.model('PendingLogin_cafex', PendingLoginSchema);