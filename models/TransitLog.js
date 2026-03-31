const mongoose = require("mongoose");

const transitSchema = new mongoose.Schema({
  vehicleReg: String,
  route: String,
  driver: String,
  revenue: Number,
  securityHash: String,
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TransitLog", transitSchema);