const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    username: String, // User's email or username
    url: String,      // The endpoint accessed
    method: String,   // HTTP method (GET, POST, etc.)
    role: String,     // User role (Admin, User, etc.)
    status: String,   // Request status (success, failure)
    time: Date,       // Time of the request
  },
  { timestamps: true }
);

const Log = mongoose.model("Log", logSchema);

module.exports = Log;
