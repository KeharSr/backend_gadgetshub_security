const express = require("express");
const logRequest = require("../middleware/activityLogs");
const router = express.Router();

// Protect the routes with authentication and apply logging middleware
const { authGuard, adminGuard } = require('../middleware/authGuard');
const Log = require("../models/logModel");

// // Example protected route with logging
// router.get("/protected-route", authGuard, logRequest, (req, res) => {
//   res.status(200).json({ message: "This is a protected route!" });
// });

// Fetch user activity logs (Admin access only)
router.get("/activity-logs", adminGuard, async (req, res) => {
  try {
    // Fetch logs from the database
    const logs = await Log.find().sort({ createdAt: -1 }); // Most recent logs first
    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching activity logs:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
