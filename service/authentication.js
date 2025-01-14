const nodemailer = require('nodemailer'); // For sending OTP emails
const otpGenerator = require('otp-generator'); // For generating OTPs

// Helper function to send OTP via email
const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use the email service provider you prefer
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASSWORD, // Your email password or app password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code for Login/Signup',
    text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
};

// Function to generate OTP
const generateOtp = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    digits: true,
  });
};

module.exports = { sendOtpEmail, generateOtp };
