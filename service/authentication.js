
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendVerificationEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification OTP',
            html: `
                <h1>Email Verification</h1>
                <p>Your OTP for email verification is: <strong>${otp}</strong></p>
                <p>This OTP will expire in 10 minutes.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.log('Email error:', error);
        return false;
    }
};


const sendLoginOTP = async (email, otp) => {
  try {
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Login Verification OTP',
          html: `
              <h1>Login Verification</h1>
              <p>Your OTP for login verification is: <strong>${otp}</strong></p>
              <p>This OTP will expire in 5 minutes.</p>
              <p>If you didn't request this login, please ignore this email.</p>
          `
      };

      await transporter.sendMail(mailOptions);
      return true;
  } catch (error) {
      console.log('Email error:', error);
      return false;
  }
};

module.exports = { sendVerificationEmail, sendLoginOTP };

