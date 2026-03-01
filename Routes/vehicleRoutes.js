const express = require("express");
const Vehicle = require("../models/vehicle");
const auth = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const vehicles = await Vehicle.find();
  res.json(vehicles);
});

router.post("/", auth, async (req, res) => {
  const vehicle = new Vehicle(req.body);
  await vehicle.save();
  res.json(vehicle);
});

module.exports = router;