const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { applySecurity, ipBlocker } = require('./middleware/security');
const rateLimit = require('express-rate-limit');
const sanitizeInput = require('./middleware/sanitize');

// 1. Initialize environment variables immediately
dotenv.config();

// 2. Connect to Database
connectDB();

const app = express();

// Required for Rate Limiting to work correctly on Render/Cloud
app.set('trust proxy', 1);

// --- START OF FIX ---
// These must stay here so the body is readable for the sanitizer
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Global Sanitization (MOVED UP)
// It MUST be here to detect malicious keys before they reach the static files or routes
app.use(sanitizeInput);
// --- END OF FIX ---

// 3. Apply Security Layers
applySecurity(app);
//app.use(ipBlocker);

// 4. Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// 6. Brute Force Protection Logic
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per window
    handler: async (req, res) => {
        const SecurityLog = require('./models/SecurityLog');
        await SecurityLog.create({
            ip: req.ip || 'Unknown',
            action: "Brute Force Threshold Reached",
            blocked: true
        });
        res.status(429).json({ msg: "Too many attempts. Account locked for 15 minutes." });
    }
});

// Apply the limiter ONLY to the login route
app.use('/api/auth/login', loginLimiter);

// 7. API Routes
app.use('/api/auth', require('./Routes/authRoutes'));
app.use('/api/transit', require('./Routes/transitRoutes'));
app.use('/api/vehicles', require('./Routes/vehicleRoutes'));
app.use('/api/security', require('./Routes/securityRoutes'));
app.use('/api/dashboard', require('./Routes/dashboardRoutes'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 8. PRODUCTION LISTEN LOGIC
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});