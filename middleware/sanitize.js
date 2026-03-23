const SecurityLog = require('../models/SecurityLog');

const sanitizeInput = async (req, res, next) => {
    const sanitize = (obj) => {
        let detected = false;
        if (obj instanceof Object) {
            for (var key in obj) {
                if (/^\$/.test(key)) {
                    detected = true;
                    delete obj[key];
                } else {
                    sanitize(obj[key]);
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