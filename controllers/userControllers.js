const { response } = require("express");
const userModel = require("../models/userModel");
const { checkout } = require("../routes/userRoutes");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendOtp = require("../service/sentOtp");
const path = require("path");
const User = require("../models/userModel");
const fs = require("fs");
const axios = require("axios");
const validator = require("validator");

const {
  sendVerificationEmail,
  sendLoginOTP,
} = require("../service/authentication");

// sanitize user input
const sanitizeInput = (input) => {
  return validator.escape(input.trim());
};

const createUser = async (req, res) => {
  console.log(req.body);
  const { firstName, lastName, userName, email, phoneNumber, password } =
    req.body;

  // Sanitize user input
  const sanitizedFirstName = sanitizeInput(firstName);
  const sanitizedLastName = sanitizeInput(lastName);
  const sanitizedUserName = sanitizeInput(userName);
  const sanitizedEmail = sanitizeInput(email);
  const sanitizedPhoneNumber = sanitizeInput(phoneNumber);
  const sanitizedPassword = password;

  if (
    !sanitizedFirstName ||
    !sanitizedLastName ||
    !sanitizedUserName ||
    !sanitizedEmail ||
    !sanitizedPhoneNumber ||
    !sanitizedPassword
  ) {
    return res.status(400).json({
      success: false,
      message: "Please enter all the fields",
    });
  }

  // Password validation
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must contain at least 8 characters, one capital letter, one number, and one special character!",
    });
  }

  // Email validation with "." and "@" in the email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(sanitizedEmail)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email address",
    });
  }

  try {
    const existingUserByEmail = await userModel.findOne({
      email: sanitizedEmail,
    });
    const existingUserByPhone = await userModel.findOne({
      phoneNumber: sanitizedPhoneNumber,
    });

    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists!",
      });
    }

    if (existingUserByPhone) {
      return res.status(400).json({
        success: false,
        message: "User with this phone number already exists!",
      });
    }

    const randomSalt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(sanitizedPassword, randomSalt);

    //Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    // generate expiry time for OTP
    const otpExpiry = Date.now() + 10 * 60 * 1000;

    const newUser = new userModel({
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      userName: sanitizedUserName,
      email: sanitizedEmail,
      phoneNumber: sanitizedPhoneNumber,
      password: hashedPassword,
      verificationOTP: otp,
      otpExpires: otpExpiry,
      isVerified: false,
    });

    await newUser.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(sanitizedEmail, otp);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Error sending verification email",
      });
    }

    res.status(201).json({
      success: true,
      message:
        "User created successfully.Please check your email for verification OTP",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};

// verifyloginOTP

const loginUser = async (req, res) => {
  const { email, password, otp } = req.body;

  const sanitizedEmail = sanitizeInput(email);
  const sanitizedPassword = password;
  const sanitizedOtp = otp ? sanitizeInput(otp) : null;

  if (!sanitizedEmail || !sanitizedPassword) {
    return res.status(400).json({
      success: false,
      message: "Please enter all the fields",
    });
  }

  try {
    const user = await userModel.findOne({ email: sanitizedEmail });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email Doesn't Exist!",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    const passwordChangedAt = user.passwordChangedAt
      ? new Date(user.passwordChangedAt).getTime()
      : 0;
    const passwordAge = Date.now() - passwordChangedAt;
    const passwordExpiryLimit = 30 * 24 * 60 * 60 * 1000; // 30 days

    if (passwordAge > passwordExpiryLimit && passwordChangedAt !== 0) {
      return res.status(403).json({
        success: false,
        message: "Password has expired. Please reset your password",
        requirePasswordReset: true,
      });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        success: false,
        message: "Account is temporarily locked. Please try again later.",
      });
    }

    const isValidPassword = await bcrypt.compare(
      sanitizedPassword,
      user.password
    );

    if (!isValidPassword) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 5 * 60 * 1000; // Lock account for 5 minutes
        user.loginAttempts = 0;
      }

      await user.save();
      console.warn(`Failed login attempt for user ${user.email}`);

      return res.status(400).json({
        success: false,
        message: "Password Doesn't Match!",
      });
    }

    if (!sanitizedOtp) {
      if (user.lastOtpRequestTime && Date.now() - user.lastOtpRequestTime < 60000) {
        return res.status(429).json({
          success: false,
          message: "Too many OTP requests. Please wait before trying again.",
        });
      }

      const loginOTP = Math.floor(100000 + Math.random() * 900000);
      user.loginOTP = loginOTP;
      user.loginOTPExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
      user.lastOtpRequestTime = Date.now();

      await user.save();
      const emailSent = await sendLoginOTP(sanitizedEmail, loginOTP);

      if (!emailSent) {
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP",
        });
      }

      return res.status(200).json({
        success: true,
        message: "OTP sent to your email",
        requireOTP: true,
      });
    }

    if (user.loginOTP !== parseInt(sanitizedOtp) || user.loginOTPExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.loginOTP = null;
    user.loginOTPExpires = null;
    user.lastLoginAt = Date.now();
    await user.save();

    const tokenPayload = { id: user._id };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const refreshToken = jwt.sign(tokenPayload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      success: true,
      message: "User Logged in Successfully!",
      token,
      refreshToken,
      userData: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Error logging in user:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


const verifyLoginOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await userModel.findOne({
      email,
      loginOTP: otp,
      loginOTPExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Reset login attempts and clear OTP
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.loginOTP = null;
    user.loginOTPExpires = null;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      success: true,
      message: "User Logged in Successfully!",
      token: token,
      userData: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await userModel.findOne({
      email,
      verificationOTP: otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Update user verification status
    user.isVerified = true;
    user.verificationOTP = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const resendLoginOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const loginOTP = Math.floor(100000 + Math.random() * 900000);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.loginOTP = loginOTP;
    user.loginOTPExpires = otpExpiry;
    await user.save();

    const emailSent = await sendLoginOTP(email, loginOTP);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("-password"); // Do not return the password

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // Respond with user profile
    return res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      user: user,
    });
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getToken = async (req, res) => {
  try {
    console.log(req.body);
    const { id } = req.body;

    // Find the user by ID
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the user is an admin
    if (user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admins are not allowed to generate tokens for this endpoint.",
      });
    }

    // Generate the token for non-admin users
    const token = await jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      success: true,
      message: "Token generated successfully!",
      token: token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error,
    });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Sanitize phone number input
  const sanitizedEmail = email ? sanitizeInput(email) : null;

  if (!sanitizedEmail) {
    return res.status(400).json({
      success: false,
      message: "Please enter your phone number",
    });
  }

  try {
    // Finding user by phone number
    const user = await userModel.findOne({ email: sanitizedEmail });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Set expiry time for OTP (10 minutes from now)
    const expiry = Date.now() + 10 * 60 * 1000;

    // Save OTP and expiry to database for verification
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = expiry;
    await user.save();

    // Send OTP to the registered phone number
    const isSent = await sendOtp(sanitizedEmail, otp);
    if (!isSent) {
      return res.status(400).json({
        success: false,
        message: "Error sending OTP",
      });
    }

    // If successful
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const verifyOtpAndResetPassword = async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({
      success: false,
      message: "Please enter all fields",
    });
  }

  try {
    const user = await userModel.findOne({ email: email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify OTP
    if (user.resetPasswordOTP !== parseInt(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check if OTP is expired
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // Check if the new password matches any in the history
    for (const oldPasswordHash of user.passwordHistory) {
      const isPasswordReused = await bcrypt.compare(password, oldPasswordHash);
      if (isPasswordReused) {
        return res.status(400).json({
          success: false,
          message:
            "New password cannot be the same as any previously used passwords",
        });
      }
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and password history
    user.passwordHistory.push(user.password); // Add current password to history
    if (user.passwordHistory.length > 5) {
      user.passwordHistory.shift(); // Keep only the last 5 passwords
    }

    user.password = hashedPassword;
    user.resetPasswordOTP = null; // Clear OTP
    user.resetPasswordExpires = null; // Clear OTP expiry
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error in verifyOtpAndResetPassword:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const uploadProfilePicture = async (req, res) => {
  console.log(req.files);
  const { profilePicture } = req.files;

  if (!profilePicture) {
    return res.status(400).json({
      success: false,
      message: "Please upload an image",
    });
  }

  // Validate file type
  const validImageExtensions = ["jpg", "jpeg", "png"];
  const fileExtension = path.extname(profilePicture.name).toLowerCase().slice(1);

  if (!validImageExtensions.includes(fileExtension)) {
    return res.status(400).json({
      success: false,
      message: "Invalid file type. Allowed formats are jpg, jpeg, and png.",
    });
  }

  // Generate new image name
  const imageName = `${Date.now()}-${profilePicture.name}`;

  // Define the upload path
  const imageUploadPath = path.join(
    __dirname,
    `../public/profile_pictures/${imageName}`
  );

  // Ensure the directory exists
  const directoryPath = path.dirname(imageUploadPath);
  fs.mkdirSync(directoryPath, { recursive: true });

  try {
    // Move the image to the upload path
    await profilePicture.mv(imageUploadPath);

    // Send the image name to the user
    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      profilePicture: imageName,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
const editUserProfile = async (req, res) => {
  const { firstName, lastName, userName, email, phoneNumber, profilePicture } =
    req.body;
  const userId = req.user.id;

  try {
    // Helper function to sanitize inputs
    const sanitizeInput = (input) => input.trim(); // Replace this with your actual sanitization logic

    // Sanitize inputs
    const sanitizedFirstName = firstName ? sanitizeInput(firstName) : undefined;
    const sanitizedLastName = lastName ? sanitizeInput(lastName) : undefined;
    const sanitizedUserName = userName ? sanitizeInput(userName) : undefined;
    const sanitizedEmail = email ? sanitizeInput(email) : undefined;
    const sanitizedPhoneNumber = phoneNumber
      ? sanitizeInput(phoneNumber)
      : undefined;

    let sanitizedProfilePicture;

    if (profilePicture) {
      // Validate profile picture file type
      const validImageExtensions = ["jpg", "jpeg", "png"];
      const fileExtension = profilePicture.split(".").pop().toLowerCase();

      if (!validImageExtensions.includes(fileExtension)) {
        return res.status(400).json({
          success: false,
          message: "Invalid file type for profile picture. Allowed formats are jpg, jpeg, and png.",
        });
      }

      sanitizedProfilePicture = sanitizeInput(profilePicture);
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user fields with sanitized data or keep the existing values
    user.firstName = sanitizedFirstName || user.firstName;
    user.lastName = sanitizedLastName || user.lastName;
    user.userName = sanitizedUserName || user.userName;
    user.email = sanitizedEmail || user.email;
    user.phoneNumber = sanitizedPhoneNumber || user.phoneNumber;
    user.profilePicture = sanitizedProfilePicture || user.profilePicture;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user profile",
      error: error.message,
    });
  }
};


const checkAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id); // Find the user by ID

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({ isAdmin: true });
  } catch (error) {
    console.error("Error in checkAdmin controller:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// update password

const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Please provide both current and new passwords",
    });
  }

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify the current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Check if the new password matches any previous password in the history
    for (const oldPassword of user.passwordHistory) {
      const isPasswordReused = await bcrypt.compare(newPassword, oldPassword);
      if (isPasswordReused) {
        return res.status(400).json({
          success: false,
          message:
            "New password cannot be the same as any of the previous passwords",
        });
      }
    }

    // Validate new password strength
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters, one capital letter, one number, and one special character!",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password and maintain the password history
    user.passwordHistory.push(user.password); // Add the current password to history
    user.password = hashedPassword;
    user.passwordChangedAt = Date.now();

    // Limit the password history to the last 5 passwords
    if (user.passwordHistory.length > 5) {
      user.passwordHistory.shift(); // Remove the oldest password
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getPasswordHistory = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "email is required",
    });
  }

  try {
    // Find the user by phone number
    const user = await userModel.findOne({ email }).select("passwordHistory");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Respond with the password history
    res.status(200).json({
      success: true,
      passwordHistory: user.passwordHistory,
    });
  } catch (error) {
    console.error("Error fetching password history:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//create a function to change password in every 30 days



module.exports = {
  createUser,
  loginUser,
  getCurrentUser,
  getToken,
  forgotPassword,
  verifyOtpAndResetPassword,
  uploadProfilePicture,
  editUserProfile,
  verifyEmail,
  resendLoginOTP,
  verifyLoginOTP,
  checkAdmin,
  updatePassword,
  getPasswordHistory,
};
