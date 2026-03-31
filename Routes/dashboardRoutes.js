const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // ADDED: Required for Object ID casting
const TransitLog = require('../models/TransitLog');
const SecurityLog = require('../models/SecurityLog');
const Vehicle = require('../models/vehicle');
const { authenticate } = require('../middleware/auth');

router.get('/stats', authenticate, async (req, res) => {
    try {
        const adminId = req.user.id;
        
        // THE FIX: Aggregation pipelines require explicit casting to ObjectId
        const objectIdAdmin = new mongoose.Types.ObjectId(adminId);

        const [activeVehicles, revenueResult, blockedAttacks, recentLogs] = await Promise.all([
            Vehicle.countDocuments({ adminId: adminId, status: "Active" }),
            
            // THE FIX: Using the casted objectIdAdmin
            TransitLog.aggregate([
                { $match: { adminId: objectIdAdmin } }, 
                { $group: { _id: null, total: { $sum: "$revenue" } } }
            ]),
            
            SecurityLog.countDocuments({ blocked: true }),
            
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