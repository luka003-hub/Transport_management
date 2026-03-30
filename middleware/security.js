const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const SecurityLog = require("../models/SecurityLog");

/**
 * applySecurity handles global security headers and rate limiting.
 * The NoSQL Sanitization and Logging are now handled exclusively 
 * by the dedicated sanitizeInput middleware to prevent logic collisions.
 */
const applySecurity = (app) => {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "https://cdn.tailwindcss.com", "'unsafe-inline'"],
        "script-src-attr": ["'unsafe-inline'"]
      },
    },
  }));

  // Rate limiting to prevent DoS and brute force at the network level
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    handler: async (req, res) => {
      try {
        await SecurityLog.create({
          ip: req.ip || 'Unknown',
          action: "Rate limit exceeded",
          blocked: true,
        });
      } catch (err) { console.error("Rate Limit Logging Error:", err); }
      res.status(429).json({ error: "Too many requests. Please try again later." });
    },
  });

  app.use(limiter);
};

/**
 * ipBlocker checks if an IP address has been flagged as 'blocked' 
 * in the SecurityLog collection.
 */
const ipBlocker = async (req, res, next) => {
  try {
    const blockedEntry = await SecurityLog.findOne({ ip: req.ip, blocked: true });
    if (blockedEntry) {
      return res.status(403).json({ error: "Access Denied: Your IP has been blocked due to security violations." });
    }
  } catch (err) { console.error("IP Blocker Error:", err); }
  next();
};

module.exports = { applySecurity, ipBlocker };