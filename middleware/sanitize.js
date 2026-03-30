const SecurityLog = require('../models/SecurityLog');

const sanitizeInput = async (req, res, next) => {
    const sanitize = (obj) => {
        let detected = false;
        if (obj instanceof Object) {
            for (var key in obj) {
                // 1. Catch Real Injections (Object Keys starting with $)
                if (/^\$/.test(key)) {
                    detected = true;
                    delete obj[key];
                } 
                // 2. Recursively check nested objects
                else if (obj[key] instanceof Object) {
                    if (sanitize(obj[key])) {
                        detected = true;
                    }
                } 
                // 3. Catch UI Demo Injections (Stringified payloads)
                else if (typeof obj[key] === 'string') {
                    // Looks for patterns like {"$gt" or {$ne inside strings
                    if (/\{\s*"\$|\{\s*\$/.test(obj[key]) || obj[key].includes('"$gt"') || obj[key].includes('"$ne"')) {
                        detected = true;
                        obj[key] = "[SANITIZED_PAYLOAD]";
                    }
                }
            }
        }
        return detected;
    };

    const isMalicious = sanitize(req.body) || sanitize(req.query) || sanitize(req.params);

    if (isMalicious) {
        // Log the injection attempt for the Security Audit page
        await SecurityLog.create({
            ip: req.ip || 'Unknown',
            action: "NoSQL Injection Attempt Blocked",
            blocked: true
        });
        return res.status(400).json({ msg: "Security Alert: Malicious characters detected and blocked." });
    }
    next();
};

module.exports = sanitizeInput;