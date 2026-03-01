const mongoose = require("mongoose");

const securitySchema = new mongoose.Schema({
  ip: String,
  action: String,
  blocked: Boolean,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SecurityLog", securitySchema);