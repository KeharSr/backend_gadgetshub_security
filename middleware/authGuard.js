// import jwt
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
    req.user = user;
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
      message: error.message === "invalid signature" ? "Invalid token signature" : "Authorization failed",
    });
  }
};



const verifyRecaptcha = async (req, res, next) => {
  console.log("Incoming reCAPTCHA Token: ", req.body.recaptchaToken); // Log the token received in the request body

  const recaptchaResponse = req.body["recaptchaToken"];
  if (!recaptchaResponse) {
    console.log("Error: reCAPTCHA response token not provided");
    return res.status(400).json({
      success: false,
      message: "reCAPTCHA response is required",
    });
  }

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error(
        "Error: RECAPTCHA_SECRET_KEY is not set in the environment"
      );
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration: Missing reCAPTCHA secret key",
      });
    }

    console.log("Sending verification request to Google reCAPTCHA API...");

    // Send verification request to Google's reCAPTCHA API
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

    console.log(
      "Google reCAPTCHA API Response:",
      JSON.stringify(data, null, 2)
    ); // Log the detailed API response

    // Check reCAPTCHA success
    if (data.success) {
      console.log("reCAPTCHA verification succeeded");
      return next();
    } else {
      console.warn("reCAPTCHA verification failed:", data["error-codes"]);

      // Handle specific reCAPTCHA error codes
      if (data["error-codes"]?.includes("timeout-or-duplicate")) {
        return res.status(401).json({
          success: false,
          message:
            "CAPTCHA expired or duplicate. Please refresh the CAPTCHA and try again.",
        });
      }

      return res.status(401).json({
        success: false,
        message: "reCAPTCHA verification failed",
        errors: data["error-codes"], // Include error codes for debugging
      });
    }
  } catch (error) {
    console.error("Error occurred while verifying reCAPTCHA:", error.message);
    console.error("Full Error Details:", error); // Log the complete error object for debugging

    res.status(500).json({
      success: false,
      message: "Error verifying reCAPTCHA",
      error: error.message, // Include the error message for more insight
    });
  }
};






module.exports = {
  authGuard,
  adminGuard,
  verifyRecaptcha,
 
};
