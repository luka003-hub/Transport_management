const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { applySecurity, ipBlocker } = require('./middleware/security');

dotenv.config();
connectDB();

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply security 
applySecurity(app);
app.use(ipBlocker);

app.use(express.static(path.join(__dirname, 'public')));

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
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});