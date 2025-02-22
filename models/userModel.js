const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },

  userName: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  phoneNumber: {
    type: String,
  },

  resetPasswordOTP: {
    type: Number,
    default: null,
  },

  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  password: {
    type: String,
    required: true,
  },
  passwordHistory: {
    type: [String], // Array of hashed passwords
    default: [],
  },

  isAdmin: {
    type: Boolean,
    default: false,
  },

  lockUntil: {
    type: Number,
  },

  loginAttempts: {
    type: Number,
    default: 0,
  },

  profilePicture: {
    type: String,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationOTP: {
    type: Number,
    default: null,
  },
  otpExpires: {
    type: Date,
    default: null,
  },

  loginOTP: {
    type: Number,
    default: null,
  },
  loginOTPExpires: {
    type: Date,
    default: null,
  },
  passwordChangedAt: {
    type: Date,
    default: Date.now(),
  },  
});

const User = mongoose.model("user", userSchema);
module.exports = User;
