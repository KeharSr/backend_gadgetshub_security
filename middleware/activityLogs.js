const Log = require("../models/logModel");
const logRequest = async (req, res, next) => {
  if (req.user) {
    try {
      // Create a new log entry
      const logEntry = new Log({
        username: req.user.email, // Assuming `req.user` is populated via auth middleware
        url: req.originalUrl, // The URL accessed
        method: req.method, // HTTP method
        role: req.user.role, // User's role
        status: res.statusCode, // HTTP status code
        time: new Date(), // Current time
      });

      // Save the log entry to the database
      await logEntry.save();
    } catch (error) {
      console.error("Error logging request:", error.message);
    }
  }
  next();
};

// Export the middleware function
module.exports = {
  logRequest,
};
