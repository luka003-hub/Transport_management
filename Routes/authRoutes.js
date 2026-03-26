const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const router = express.Router();

// @route   POST /api/auth/register
router.post("/api/auth/register", async (req, res) => {
    try {
        const { username, password, role } = req.body;

        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ msg: "User already exists" });

        user = new User({ username, password, role });
        await user.save();

        //Send JSON success instead of redirect
        res.status(201).json({ msg: "User registered successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error during registration" });
    }
});

// @route   POST /api/auth/login
router.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ msg: "Invalid Username" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid Password" });

        // Generate Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        // Send the token to the frontend as JSON
        res.json({ token, msg: "Login successful" });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error during login" });
    }
});

module.exports = router;