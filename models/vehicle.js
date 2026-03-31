const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  regNumber: { type: String, required: true },
  route: String,
  driver: String,
  status: { type: String, default: "Active" },
  //  FIX: This ties the vehicle to the specific admin who created it
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model("Vehicle", vehicleSchema);