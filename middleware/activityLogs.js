// const Log = require("../models/logModel");

// const logRequest = async (req, res, next) => {
//   if (req.user) {
//     try {
//       const logEntry = new Log({
//         username: req.user.id || "Unknown User",
//         url: req.originalUrl,
//         method: req.method,
//         role: req.user.role || "User", // Dynamically set role
//         status: res.statusCode,
//         time: new Date(),
//         headers: req.headers, // Include headers
//         device: req.headers["user-agent"], // Include device information
//         ipAddress: req.ip, // Include IP address
//       });

//       await logEntry.save();
//     } catch (error) {
//       console.error("Error logging request:", error.message);
//     }
//   } else {
//     try {
//       const logEntry = new Log({
//         username: "Unknown User",
//         url: req.originalUrl,
//         method: req.method,
//         role: "User", // Dynamically set role
//         status: res.statusCode,
//         time: new Date(),
//         headers: req.headers, // Include headers
//         device: req.headers["user-agent"], // Include device information
//         ipAddress: req.ip, // Include IP address
//       });

//       await logEntry.save();
//     } catch (error) {
//       console.error("Error logging request:", error.message);
//     }
//   }
//   next();
// };

// module.exports = {
//   logRequest,
// };


const Log = require("../models/logModel");

const logRequest = async (req, res, next) => {
  const logEntry = new Log({
    username: req.user ? req.user.username || req.user.email || "Unknown User" : "Unknown User",
    url: req.originalUrl,
    method: req.method,
    role: req.user?.role || "User", // Dynamically set role
    status: res.statusCode,
    time: new Date(),
    headers: req.headers, // Include headers
    device: req.headers["user-agent"], // Include device information
    ipAddress: req.ip, // Include IP address
  });

  try {
    await logEntry.save();
  } catch (error) {
    console.error("Error logging request:", error.message);
  }

  next();
};

module.exports = {
  logRequest,
};
