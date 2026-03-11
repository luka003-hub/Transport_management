const express = require("express");
const Vehicle = require("../models/vehicle");
// FIX: Destructure authenticate and authorize from the middleware object
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles
 * @access  Private (All authenticated users)
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.json(vehicles);
  } catch (error) {
    console.error("Fetch Vehicles Error:", error);
    res.status(500).json({ error: "Error fetching vehicles" });
  }
});

/**
 * @route   POST /api/vehicles
 * @desc    Add a new vehicle
 * @access  Private (Admin Only)
 */
router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { vehicleReg, status } = req.body;

    if (!vehicleReg) {
      return res.status(400).json({ error: "Vehicle registration is required" });
    }

    // Check if vehicle already exists to prevent duplicates
    const existingVehicle = await Vehicle.findOne({ vehicleReg });
    if (existingVehicle) {
      return res.status(400).json({ error: "Vehicle already registered" });
    }

    const vehicle = new Vehicle({ 
      vehicleReg, 
      status: status || "Active" 
    });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("Create Vehicle Error:", error);
    res.status(500).json({ error: "Error creating vehicle" });
  }
});

module.exports = router;