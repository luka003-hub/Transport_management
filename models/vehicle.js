const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
  regNumber: String,
  route: String,
  driver: String,
  status: { type: String, default: "Active" }
});

module.exports = mongoose.model("Vehicle", vehicleSchema);