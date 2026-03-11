const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Vehicle = require('./models/vehicle');
const TransitLog = require('./models/TransitLog');
const SecurityLog = require('./models/SecurityLog');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to Atlas for seeding...");

        // Clear existing data
        await Vehicle.deleteMany({});
        await TransitLog.deleteMany({});

        // 1. Seed Vehicles
        const vehicles = await Vehicle.insertMany([
            { regNumber: "KCD 445J", route: "Nairobi - Thika", driver: "Mwangi J.", status: "Active" },
            { regNumber: "KDB 991L", route: "Juja - CBD", driver: "Kamau P.", status: "Active" },
            { regNumber: "KCA 101A", route: "Ruiru - Githurai", driver: "John D.", status: "Active" }
        ]);

        // 2. Seed Transit Logs (with Security Hashes)
        await TransitLog.insertMany([
            { 
                vehicleReg: "KCD 445J", 
                route: "Nairobi - Thika", 
                driver: '{"iv":"123","content":"hidden"}', // Mocking encrypted format
                revenue: 4500, 
                securityHash: "8f3e2a11b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4" 
            },
            { 
                vehicleReg: "KDB 991L", 
                route: "Juja - CBD", 
                driver: '{"iv":"456","content":"hidden"}', 
                revenue: 3200, 
                securityHash: "1c9d9b02a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8" 
            }
        ]);

        // 3. Seed Security Logs (Blocked Attacks)
        await SecurityLog.insertMany([
            { ip: "192.168.1.50", action: "Brute Force Attempt", blocked: true },
            { ip: "45.33.22.11", action: "SQL Injection Suspected", blocked: true }
        ]);

        console.log("Database Seeded Successfully! Dashboard should now show data.");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();