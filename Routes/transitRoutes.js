const express = require("express");
const crypto = require("crypto");
// Fix: Destructure the middleware functions
const { authenticate, authorize } = require("../middleware/auth");
const TransitLog = require("../models/TransitLog");
const SecurityLog = require("../models/SecurityLog");
const { encrypt } = require("../utils/encryption");

const router = express.Router();

// @route   POST /api/transit
router.post("/api/transit", authenticate, authorize("admin"), async (req, res) => {
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
      securityHash
    });

    await transitLog.save();
    res.status(201).json({ message: "Transit log created securely", transitLog });
  } catch (error) {
    console.error("Transit Creation Error:", error);
    await SecurityLog.create({
      ip: req.ip,
      action: `Failed Transit Creation: ${error.message}`,
      blocked: false
    });
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/transit
router.get("/api/transit", authenticate, async (req, res) => {
  try {
    const logs = await TransitLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// @route   GET /api/transit/daily-revenue
router.get("/api/transit/daily-revenue", authenticate, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await TransitLog.aggregate([
      { $match: { timestamp: { $gte: startOfDay } } },
      { $group: { _id: null, totalRevenue: { $sum: "$revenue" } } }
    ]);

    res.json({ totalRevenue: result[0]?.totalRevenue || 0 });
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate revenue" });
  }
});

// @route   DELETE
router.delete("/api/transit/:id", authenticate, authorize("admin"), async (req, res) => {
  try {
    const log = await TransitLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ error: "Log not found" });
    res.json({ message: "Transit log deleted securely" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;