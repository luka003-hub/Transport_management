const express = require('express');
const router = express.Router();
const TransitLog = require('../models/TransitLog');
const SecurityLog = require('../models/SecurityLog');
const Vehicle = require('../models/vehicle');
const auth = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
    try {
        // 1. Get total active vehicles
        const activeVehicles = await Vehicle.countDocuments({ status: "Active" });

        // 2. Calculate Total Revenue from all time
        const transitData = await TransitLog.find();
        const totalRevenue = transitData.reduce((sum, log) => sum + (log.revenue || 0), 0);

        // 3. Count Blocked Security Intrusions (for the red counter)
        const blockedAttacks = await SecurityLog.countDocuments({ blocked: true });

        // 4. Get the last 5 logs for the table (Security Focused)
        const recentLogs = await TransitLog.find().sort({ timestamp: -1 }).limit(5);

        res.json({
            activeVehicles,
            totalRevenue,
            blockedAttacks,
            recentLogs
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
});

module.exports = router;