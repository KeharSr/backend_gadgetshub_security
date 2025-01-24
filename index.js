const express = require("express");
const mongoose = require("mongoose");
const Database = require("./database/database");
const dotenv = require("dotenv");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const axios = require("axios");
const fs = require("fs");
const https = require("https");
const path = require("path");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { logRequest } = require("./middleware/activityLogs");

dotenv.config();
const app = express();

// Updated CORS Configuration
const corsOptions = {
  origin: [process.env.FRONTEND_URL || "https://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "x-csrf-token",
  ],
};
app.use(cors(corsOptions));

app.use(logRequest);

// helemt security 
app.use(helmet());

// morgan tiny
app.use(morgan("tiny"));



const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(limiter);


// API request limit
app.use(express.json({ limit: "50mb" }));

// Body parser and file upload
app.use(express.json());
app.use(fileUpload());



// Mongo sanitization
app.use(mongoSanitize());

// Database Connection
Database();

// Routes
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/product", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/order", require("./routes/orderRoutes"));
app.use("/api/review", require("./routes/review&ratingRoutes"));
app.use("/api/favourite", require("./routes/favouritesRoutes"));
app.use("/api/khalti", require("./routes/paymentRoutes"));
app.use("/api/logs", require("./routes/logRoutes"));

app.get("/", (req, res) => {
  res.send("Hello gadgetshub from SSL server");
  console.log("Hello gadgetshub from SSL server");
});

// Khalti Payment Gateway
app.post("/khalti-api", async (req, res) => {
  try {
    const payload = req.body;
    const khaltiResponse = await axios.post(
      "https://a.khalti.com/api/v2/epayment/initiate/",
      payload,
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
        },
      }
    );

    if (khaltiResponse.data) {
      res.send({
        success: true,
        data: khaltiResponse.data,
      });
    } else {
      res.send({
        success: false,
        message: "Error in initiating",
      });
    }
  } catch (error) {
    console.error(
      "Error initiating Khalti payment:",
      error.response ? error.response.data : error.message
    );
    res.status(500).send({
      success: false,
      message: "Error in initiating",
      error: error.message,
    });
  }
});

// HTTPS Configuration
const options = {
  key: fs.readFileSync(path.resolve(__dirname, "server.key")),
  cert: fs.readFileSync(path.resolve(__dirname, "server.crt")),
};

// Start HTTPS Server
const PORT = process.env.PORT || 5000;

https.createServer(options, app).listen(PORT, () => {
  console.log(`Secure server is running on https://localhost:${PORT}`);
});

module.exports = app;
