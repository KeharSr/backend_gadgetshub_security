const nodemailer = require("nodemailer");

const sendOtp = async (email, otp) => {
  // Configure the transport
  const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASSWORD, 
    },
  });

  // Email content
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender address
    to: email, // Recipient address
    subject: "Your OTP Code", // Subject line
    text: `Your OTP is: ${otp}`, // Plain text body
    html: `<p>Your OTP is: <b>${otp}</b></p>`, // HTML body
  };

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return true; // Return true if email sent successfully
  } catch (error) {
    console.error("Error sending email:", error.message);
    return false; // Return false if there's an error
  }
};

module.exports = sendOtp;
