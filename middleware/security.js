const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const SecurityLog = require("../models/SecurityLog");

/**
 * Custom Manual Sanitizer for Node.js v22 Compatibility
 * This cleans '$' and '.' from keys in req.body, req.query, and req.params
 */
const manualSanitize = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj instanceof Object && !Array.isArray(obj)) {
      for (const key in obj) {
        let currentKey = key;
        
        // If key is malicious, rename it
        if (key.startsWith('$') || key.includes('.')) {
          const sanitizedKey = key.replace(/[\$.]/g, '_');
          obj[sanitizedKey] = obj[key];
          delete obj[key];
          currentKey = sanitizedKey;
        }
        
        // Recursively sanitize nested objects
        if (obj[currentKey] instanceof Object) {
          sanitize(obj[currentKey]);
        }
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  if (req.query) {
    try {
      // Clean query parameters safely without overwriting the read-only object
      const queryStr = JSON.stringify(req.query).replace(/["']\$[^"']+["']:/g, (match) => match.replace('$', '_'));
      const cleanQuery = JSON.parse(queryStr);
      
      // Remove original malicious keys
      for (const key in req.query) {
        if (key.startsWith('$') || key.includes('.')) delete req.query[key];
      }
      // Inject clean keys
      Object.assign(req.query, cleanQuery);
    } catch (e) {
      console.error("Query Sanitization Error:", e);
    }
  }
  next();
};

const applySecurity = (app) => {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "https://cdn.tailwindcss.com", "'unsafe-inline'"],
      },
    },
  }));

  //manual fix instead of the express-mongo-sanitize package
  app.use(manualSanitize);

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    handler: async (req, res) => {
      try {
        await SecurityLog.create({
          ip: req.ip,
          action: "Rate limit exceeded",
          blocked: true,
        });
      } catch (err) { console.error(err); }
      res.status(429).json({ error: "Too many requests." });
    },
  });

  app.use(limiter);
};

const ipBlocker = async (req, res, next) => {
  try {
    const blocked = await SecurityLog.findOne({ ip: req.ip, blocked: true });
    if (blocked) return res.status(403).json({ error: "Your IP has been blocked." });
  } catch (err) { console.error(err); }
  next();
};

module.exports = { applySecurity, ipBlocker };