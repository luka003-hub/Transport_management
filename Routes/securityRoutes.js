const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const SecurityLog = require("../models/SecurityLog");

const router = express.Router();

// @route   GET /api/security/logs
router.get("api/security/logs", authenticate, authorize("admin"), async (req, res) => {
  try {
    const logs = await SecurityLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch security logs" });
  }
});

// @route   GET /api/security/blocked-count
router.get("api/security/blocked-count", authenticate, authorize("admin"), async (req, res) => {
  try {
    const count = await SecurityLog.countDocuments({ blocked: true });
    res.json({ blockedAttacks: count });
  } catch (error) {
    res.status(500).json({ error: "Failed to count blocked attacks" });
  }
});

// @route   POST /api/security/log
router.post("api/security/log", authenticate, async (req, res) => {
  try {
    const { action, blocked } = req.body;
    const log = new SecurityLog({
      ip: req.ip,
      action,
      blocked: blocked || false
    });
    await log.save();
    res.status(201).json({ message: "Security event logged" });
  } catch (error) {
    res.status(500).json({ error: "Failed to log security event" });
  }
});

// @route   POST /api/security/block-ip
router.post("/api/security/block-ip", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { ip, reason } = req.body;
    if (!ip) return res.status(400).json({ error: "IP required" });

    await SecurityLog.create({
      ip,
      action: reason || "Manual IP block",
      blocked: true
    });
    res.status(201).json({ message: `IP ${ip} blocked` });
  } catch (error) {
    res.status(500).json({ error: "Failed to block IP" });
  }
});

module.exports = router;