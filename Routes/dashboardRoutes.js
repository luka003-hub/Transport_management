const express = require('express');
const router = express.Router();
const TransitLog = require('../models/TransitLog');
const SecurityLog = require('../models/SecurityLog');
const Vehicle = require('../models/vehicle');
const { authenticate } = require('../middleware/auth');

router.get('/stats', authenticate, async (req, res) => {
    try {
        const adminId = req.user.id;

        const [activeVehicles, revenueResult, blockedAttacks, recentLogs] = await Promise.all([
            // FIX: Only count this admin's active vehicles
            Vehicle.countDocuments({ adminId: adminId, status: "Active" }),
            
            // FIX: Sum revenue only from this admin's transit logs
            TransitLog.aggregate([
                { $match: { adminId: adminId } }, 
                { $group: { _id: null, total: { $sum: "$revenue" } } }
            ]),
            
            // Note: SecurityLogs usually stay global for the system owner, 
            // but if you want per-admin logs, add adminId to SecurityLog model too.
            SecurityLog.countDocuments({ blocked: true }),
            
            // FIX: Show only this admin's recent logs
            TransitLog.find({ adminId: adminId }).sort({ timestamp: -1 }).limit(5)
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