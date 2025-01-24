const Log = require("../models/logModel");

const logRequest = async (req, res, next) => {
  if (req.user) {
    try {
      const logEntry = new Log({
        username: req.user.email,
        url: req.originalUrl,
        method: req.method,
        role: req.user.role || "User", // Dynamically set role
        status: res.statusCode,
        time: new Date(),
        headers: req.headers, // Include headers
        device: req.headers['user-agent'], // Include device information
        ipAddress: req.ip, // Include IP address
      });

      await logEntry.save();
    } catch (error) {
      console.error("Error logging request:", error.message);
    }
  }
  next();
};

module.exports = {
  logRequest,
};