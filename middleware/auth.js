const jwt = require("jsonwebtoken");
const SecurityLog = require("../models/SecurityLog");

/**
 * Authenticate JWT Token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      await SecurityLog.create({
        ip: req.ip,
        action: "Missing or malformed token",
        blocked: false
      });

      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    await SecurityLog.create({
      ip: req.ip,
      action: "Invalid or expired token attempt",
      blocked: true
    });

    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

/**
 * Role-based Access Control
 * Usage: authorize("admin")
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient privileges" });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};