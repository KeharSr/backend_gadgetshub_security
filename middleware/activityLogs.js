const Log = require("../models/logModel");

const logRequest = async (req, res, next) => {
  if (req.user) {
    try {
      const logEntry = new Log({
        username: req.user.email,
        url: req.originalUrl,
        method: req.method,
        role: req.user.isAdmin ? "Admin" : "User",
        status: res.statusCode,
        time: new Date(),
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