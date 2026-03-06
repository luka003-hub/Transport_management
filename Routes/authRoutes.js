const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const router = express.Router();

// @route   POST /api/auth/register
// Register a new user
router.post("/register", async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Check if user exists
        let user = await User.findOne({ username });
        if (user) return res.status(400).send("User already exists");

        // Create new user
        user = new User({ username, password, role });
        await user.save();

        // Redirect to login after successful signup
        res.redirect('/index.html');
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error during registration");
    }
});

// @route   POST /api/auth/login
// Login user & redirect to dashboard
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(400).send("Invalid Username");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send("Invalid Password");

        // Generate Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        // redirect to dashboard
        res.redirect('/dashboard.html');
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error during login");
    }
});

module.exports = router;