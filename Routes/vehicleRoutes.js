const express = require("express");
const Vehicle = require("../models/vehicle");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles
 * @access  Private (All authenticated users)
 */
router.get("/api/vehicles", authenticate, async (req, res) => {
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
router.post("/api/vehicles", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { regNumber, status, route, driver } = req.body;

    if (!regNumber) {
      return res.status(400).json({ error: "Vehicle registration is required" });
    }

    const existingVehicle = await Vehicle.findOne({ regNumber });
    if (existingVehicle) {
      return res.status(400).json({ error: "Vehicle already registered" });
    }

    const vehicle = new Vehicle({ 
      regNumber,
      route,
      driver,
      status: status || "Active" 
    });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("Create Vehicle Error:", error);
    res.status(500).json({ error: "Error creating vehicle" });
  }
});

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Remove a vehicle from fleet
 * @access  Private (Admin Only)
 */
router.delete("/api/vehicles/:id", authenticate, authorize("admin"), async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ error: "Vehicle not found" });
        }
        res.json({ msg: "Vehicle removed successfully" });
    } catch (error) {
        console.error("Delete Vehicle Error:", error);
        res.status(500).json({ error: "Internal server error during deletion" });
    }
});

module.exports = router;