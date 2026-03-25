const express = require('express');
const router = express.Router();
const TransitLog = require('../models/TransitLog');
const SecurityLog = require('../models/SecurityLog');
const Vehicle = require('../models/vehicle');
const { authenticate } = require('../middleware/auth');

router.get('/api/dashboard/stats', authenticate, async (req, res) => {
    try {
        const [activeVehicles, revenueResult, blockedAttacks, recentLogs] = await Promise.all([
            Vehicle.countDocuments({ status: "Active" }),
            TransitLog.aggregate([
                { $group: { _id: null, total: { $sum: "$revenue" } } }
            ]),
            SecurityLog.countDocuments({ blocked: true }),
            TransitLog.find().sort({ timestamp: -1 }).limit(5)
        ]);

        res.json({
            activeVehicles,
            totalRevenue: revenueResult[0]?.total || 0,
            blockedAttacks,
            recentLogs
        });
    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
});

module.exports = router;