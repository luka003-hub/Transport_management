const mongoose = require("mongoose");

const transitSchema = new mongoose.Schema({
  vehicleReg: String,
  route: String,
  driver: String,
  revenue: Number,
  securityHash: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TransitLog", transitSchema);