const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { applySecurity, ipBlocker } = require('./middleware/security');
const rateLimit = require('express-rate-limit');
const sanitizeInput = require('./middleware/sanitize');

dotenv.config();
connectDB();

const app = express();
app.set('trust proxy', 1);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply security 
applySecurity(app);
app.use(ipBlocker);

app.use(express.static(path.join(__dirname, 'public')));


//Global Sanitization (Apply to all routes)
app.use(sanitizeInput);

// Brute Force Protection Logic
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per window
    handler: async (req, res) => {
        const SecurityLog = require('./models/SecurityLog');
        await SecurityLog.create({
            ip: req.ip,
            action: "Brute Force Threshold Reached",
            blocked: true
        });
        res.status(429).json({ msg: "Too many attempts. Account locked for 15 minutes." });
    }
});

//Apply the limiter ONLY to the login route
app.use('/api/auth/login', loginLimiter);


// Routes
app.use('/api/auth', require('./Routes/authRoutes'));
app.use('/api/transit', require('./Routes/transitRoutes'));
app.use('/api/vehicles', require('./Routes/vehicleRoutes'));
app.use('/api/security', require('./Routes/securityRoutes'));
app.use('/api/dashboard', require('./Routes/dashboardRoutes'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});