const express = require("express");
const Vehicle = require("../models/vehicle");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

/**
 * @route    GET /api/vehicles
 * @desc     Get ONLY the logged-in admin's vehicles
 * @access   Private
 */
router.get("/", authenticate, async (req, res) => {
  try {
    // FIX: Filter by adminId to ensure data isolation
    const vehicles = await Vehicle.find({ adminId: req.user.id });
    res.json(vehicles);
  } catch (error) {
    console.error("Fetch Vehicles Error:", error);
    res.status(500).json({ error: "Error fetching vehicles" });
  }
});

/**
 * @route    POST /api/vehicles
 * @desc     Add a new vehicle attached to this admin
 * @access   Private (Admin Only)
 */
router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { regNumber, status, route, driver } = req.body;

    if (!regNumber) {
      return res.status(400).json({ error: "Vehicle registration is required" });
    }

    // Check if THIS admin already has this vehicle
    const existingVehicle = await Vehicle.findOne({ regNumber, adminId: req.user.id });
    if (existingVehicle) {
      return res.status(400).json({ error: "You have already registered this vehicle" });
    }

    const vehicle = new Vehicle({ 
      regNumber,
      route,
      driver,
      status: status || "Active",
      adminId: req.user.id // FIX: Attach the creator's ID
    });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    console.error("Create Vehicle Error:", error);
    res.status(500).json({ error: "Error creating vehicle" });
  }
});

/**
 * @route    DELETE /api/vehicles/:id
 * @desc     Remove a vehicle (Only if owned by this admin)
 * @access   Private (Admin Only)
 */
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
    try {
        // FIX: Ensure the vehicle belongs to this admin before deleting
        const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
        if (!vehicle) {
            return res.status(404).json({ error: "Vehicle not found or unauthorized" });
        }
        res.json({ msg: "Vehicle removed successfully" });
    } catch (error) {
        console.error("Delete Vehicle Error:", error);
        res.status(500).json({ error: "Internal server error during deletion" });
    }
});

module.exports = router;