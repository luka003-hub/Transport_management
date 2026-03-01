const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const SecurityLog = require("../models/SecurityLog");

/**
 * Apply Global Security Middleware
 */
const applySecurity = (app) => {
  // Security headers
  app.use(helmet());

  // Prevent MongoDB injection
  app.use(mongoSanitize());

  // Prevent XSS
  app.use(xss());

  // Rate limiting (anti-brute force)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    handler: async (req, res) => {
      await SecurityLog.create({
        ip: req.ip,
        action: "Rate limit exceeded",
        blocked: true
      });

      res.status(429).json({
        error: "Too many requests. Try again later."
      });
    }
  });

  app.use(limiter);
};

/**
 * IP Block Middleware (checks DB for blocked IPs)
 */
const ipBlocker = async (req, res, next) => {
  const blocked = await SecurityLog.findOne({
    ip: req.ip,
    blocked: true
  });

  if (blocked) {
    return res.status(403).json({
      error: "Your IP has been blocked."
    });
  }

  next();
};

module.exports = {
  applySecurity,
  ipBlocker
};