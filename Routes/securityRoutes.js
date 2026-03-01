const express = require("express");
const auth = require("../middleware/auth");
const SecurityLog = require("../models/SecurityLog");

const router = express.Router();

/**
 * Middleware: Admin Only
 */
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin only." });
  }
  next();
};

/**
 * @route   GET /api/security/logs
 * @desc    Get all security logs
 * @access  Admin
 */
router.get("/logs", auth, adminOnly, async (req, res) => {
  try {
    const logs = await SecurityLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch security logs" });
  }
});

/**
 * @route   GET /api/security/blocked-count
 * @desc    Get total blocked attacks (Dashboard use)
 * @access  Admin
 */
router.get("/blocked-count", auth, adminOnly, async (req, res) => {
  try {
    const count = await SecurityLog.countDocuments({ blocked: true });
    res.json({ blockedAttacks: count });
  } catch (error) {
    res.status(500).json({ error: "Failed to count blocked attacks" });
  }
});

/**
 * @route   POST /api/security/log
 * @desc    Log suspicious activity
 * @access  Private
 */
router.post("/log", auth, async (req, res) => {
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

/**
 * @route   POST /api/security/block-ip
 * @desc    Manually block an IP
 * @access  Admin
 */
router.post("/block-ip", auth, adminOnly, async (req, res) => {
  try {
    const { ip, reason } = req.body;

    const log = new SecurityLog({
      ip,
      action: reason || "Manual IP block",
      blocked: true
    });

    await log.save();

    res.status(201).json({
      message: `IP ${ip} blocked and recorded`
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to block IP" });
  }
});

/**
 * @route   DELETE /api/security/:id
 * @desc    Delete a security log
 * @access  Admin
 */
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const log = await SecurityLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ error: "Log not found" });
    }

    await log.deleteOne();

    res.json({ message: "Security log deleted" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;