const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Body Parser Middleware 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files 
app.use(express.static(path.join(__dirname, 'public')));

// Link Authentication Routes
app.use('/api/auth', require('./Routes/authRoutes'));

// Basic entry route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});