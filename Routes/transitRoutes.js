const express = require("express");
const crypto = require("crypto");
const { authenticate, authorize } = require("../middleware/auth");
const TransitLog = require("../models/TransitLog");
const SecurityLog = require("../models/SecurityLog");
const { encrypt } = require("../utils/encryption");

const router = express.Router();

// @route    POST /api/transit
// @desc     Create a log tied to the authenticated admin
router.post("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { vehicleReg, route, driver, revenue } = req.body;

    if (!vehicleReg || !route || revenue === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const encryptedDriver = encrypt(driver);

    const securityHash = crypto
      .createHash("sha256")
      .update(`${vehicleReg}-${route}-${revenue}-${Date.now()}`)
      .digest("hex");

    const transitLog = new TransitLog({
      vehicleReg,
      route,
      driver: JSON.stringify(encryptedDriver),
      revenue,
      securityHash,
      adminId: req.user.id // THE FIX: Attach the creator's ID
    });

    await transitLog.save();
    res.status(201).json({ message: "Transit log created securely", transitLog });
  } catch (error) {
    console.error("Transit Creation Error:", error);
    await SecurityLog.create({
      ip: req.ip || 'Unknown',
      action: `Failed Transit Creation: ${error.message}`,
      blocked: false
    });
    res.status(500).json({ error: "Server error" });
  }
});

// @route    GET /api/transit
// @desc     Get ONLY the logged-in admin's logs
router.get("/", authenticate, async (req, res) => {
  try {
    // THE FIX: Filter by adminId
    const logs = await TransitLog.find({ adminId: req.user.id }).sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// @route    GET /api/transit/daily-revenue
// @desc     Calculate revenue ONLY for the logged-in admin
router.get("/daily-revenue", authenticate, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await TransitLog.aggregate([
      // THE FIX: Match both the date AND the specific adminId
      { $match: { 
          adminId: req.user.id, 
          timestamp: { $gte: startOfDay } 
      } },
      { $group: { _id: null, totalRevenue: { $sum: "$revenue" } } }
    ]);

    res.json({ totalRevenue: result[0]?.totalRevenue || 0 });
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate revenue" });
  }
});

// @route    DELETE
// @desc     Delete ONLY if the log belongs to the logged-in admin
router.delete("/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    // THE FIX: Ensure ownership before deletion
    const log = await TransitLog.findOneAndDelete({ _id: req.params.id, adminId: req.user.id });
    if (!log) return res.status(404).json({ error: "Log not found or unauthorized" });
    res.json({ message: "Transit log deleted securely" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;