const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const authGuard = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(400).json({
      success: false,
      message: "Auth header not found",
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token || token === "") {
    return res.status(400).json({
      success: false,
      message: "Token not found",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    req.user = user; // Ensure user data is available for subsequent middleware
    next();
  } catch (error) {
    console.error("Auth guard error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

const adminGuard = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied! Admin privileges required.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Admin guard error:", error.message);
    return res.status(401).json({
      success: false,
      message:
        error.message === "invalid signature"
          ? "Invalid token signature"
          : "Authorization failed",
    });
  }
};

const verifyRecaptcha = async (req, res, next) => {
  const recaptchaResponse = req.body.recaptchaToken;

  if (!recaptchaResponse) {
    return res.status(400).json({
      success: false,
      message: "reCAPTCHA response is required",
    });
  }

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration: Missing reCAPTCHA secret key",
      });
    }

    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: secretKey,
          response: recaptchaResponse,
        },
      }
    );

    const data = response.data;

    if (data.success) {
      return next();
    } else {
      return res.status(401).json({
        success: false,
        message: "reCAPTCHA verification failed",
        errors: data["error-codes"],
      });
    }
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error verifying reCAPTCHA",
      error: error.message,
    });
  }
};

module.exports = {
  authGuard,
  adminGuard,
  verifyRecaptcha,
};
