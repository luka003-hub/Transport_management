const express = require("express");
const crypto = require("crypto");
const auth = require("../middleware/auth");
const TransitLog = require("../models/TransitLog");
const SecurityLog = require("../models/SecurityLog");
const { encrypt } = require("../utils/encryption");

const router = express.Router();

/**
 * @route   POST /api/transit
 * @desc    Create new transit log (encrypted + hashed)
 * @access  Private (Admin)
 */
router.post("/", auth, async (req, res) => {
  try {
    const { vehicleReg, route, driver, revenue } = req.body;

    // Encrypt sensitive driver info
    const encryptedDriver = encrypt(driver);

    // Generate security hash for integrity verification
    const securityHash = crypto
      .createHash("sha256")
      .update(vehicleReg + route + revenue + Date.now())
      .digest("hex");

    const transitLog = new TransitLog({
      vehicleReg,
      route,
      driver: JSON.stringify(encryptedDriver), // store encrypted
      revenue,
      securityHash
    });

    await transitLog.save();

    res.status(201).json({
      message: "Transit log created securely",
      transitLog
    });
  } catch (error) {
    console.error(error);

    // Log suspicious error
    await SecurityLog.create({
      ip: req.ip,
      action: "Transit Log Creation Failed",
      blocked: false
    });

    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @route   GET /api/transit
 * @desc    Get all transit logs
 * @access  Private
 */
router.get("/", auth, async (req, res) => {
  try {
    const logs = await TransitLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

/**
 * @route   GET /api/transit/daily-revenue
 * @desc    Get today's total revenue
 * @access  Private
 */
router.get("/daily-revenue", auth, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await TransitLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$revenue" }
        }
      }
    ]);

    res.json({
      totalRevenue: result[0]?.totalRevenue || 0
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate revenue" });
  }
});

/**
 * @route   GET /api/transit/:id
 * @desc    Get single transit log
 * @access  Private
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const log = await TransitLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ error: "Log not found" });
    }

    res.json(log);
  } catch (error) {
    res.status(500).json({ error: "Error retrieving log" });
  }
});

/**
 * @route   DELETE /api/transit/:id
 * @desc    Delete transit log
 * @access  Admin only
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const log = await TransitLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ error: "Log not found" });
    }

    await log.deleteOne();

    res.json({ message: "Transit log deleted securely" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;