// import jwt
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const httpStatus = require("http-status-codes");
const authGuard = async (req, res, next) => {
  //check incoming data
  console.log(req.headers); // passed going to next

  // get authorization data fromheader
  const authHeader = req.headers.authorization;

  // check or validate
  if (!authHeader) {
    return res.status(400).json({
      success: false,
      message: "Auth header not found",
    });
  }

  // Split the data(Format: Bearer token)
  const token = authHeader.split(" ")[1];

  // if token not found : stop the process (res)
  if (!token || token === "") {
    return res.status(400).json({
      success: false,
      message: "Token not found",
    });
  }

  // verify
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(500).json({
      sucess: false,
      message: "Not Authorized",
    });
  }
  // if verified : next (function is controller)

  // not verified : not auth
};

// Admin guard
const adminGuard = (req, res, next) => {
  //check incoming data
  console.log(req.headers);
  // passed going to next

  // get authorization data fromheader
  const authHeader = req.headers.authorization;

  // check or validate
  if (!authHeader) {
    return res.status(400).json({
      success: false,
      message: "Auth header not found",
    });
  }

  // Split the data(Format: Bearer token)
  const token = authHeader.split(" ")[1];

  // if token not found : stop the process (res)
  if (!token || token === "") {
    return res.status(400).json({
      success: false,
      message: "Token not found",
    });
  }

  // verify
  try {
    const decodeUserData = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decodeUserData);
    req.user = decodeUserData; //id, isAdmin
    if (!req.user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: "Prabesh Nised!", //Permission Denied
      });
    }
    next();
  } catch (error) {
    res.status(500).json({
      sucess: false,
      message: "Not Authorized",
    });
  }
  // if verified : next (function is controller)

  // not verified : not auth
};

const verifyRecaptcha = async (req, res, next) => {
    console.log("Incoming reCAPTCHA Token: ", req.body.recaptchaToken); // Log the token received in the request body
  
    const recaptchaResponse = req.body["recaptchaToken"];
    if (!recaptchaResponse) {
      console.log("Error: reCAPTCHA response token not provided");
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "reCAPTCHA response is required",
      });
    }
  
    try {
      const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
      if (!secretKey) {
        console.error("Error: RECAPTCHA_SECRET_KEY is not set in the environment");
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Server misconfiguration: Missing reCAPTCHA secret key",
        });
      }
  
      console.log("Sending verification request to Google reCAPTCHA API...");
  
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
  
      console.log("Google reCAPTCHA API Response:", JSON.stringify(data, null, 2)); // Log the detailed API response
  
      if (data.success) {
        console.log("reCAPTCHA verification succeeded");
        next();
      } else {
        console.warn("reCAPTCHA verification failed:", data["error-codes"]);
        res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: "reCAPTCHA verification failed",
          errors: data["error-codes"], // Include error codes for debugging
        });
      }
    } catch (error) {
      console.error("Error occurred while verifying reCAPTCHA:", error.message);
      console.error("Full Error Details:", error); // Log the complete error object for debugging
  
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
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
