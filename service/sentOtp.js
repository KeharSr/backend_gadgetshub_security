const axios = require("axios");

const sendOtp = async (phoneNumber, otp) => {
  const url = "https://api.managepoint.co/api/sms/send";

  // payload to send
  const payload = {
    apiKey: "c1c5427b-6c19-4f42-a534-7c0e4d550659",
    to: phoneNumber,
    message: `Your OTP is ${otp}`,
  };

  try {
    const res = await axios.post(url, payload);

    // Check for successful HTTP status code (200)
    if (res.status === 200) {
      console.log("OTP sent successfully!");
      return true; // Return true on success
    } else {
      console.error("Failed to send OTP, response:", res.data);
      return false; // Return false for non-200 status codes
    }
  } catch (error) {
    console.error("Error in sending OTP:", error.message);
    return false; // Return false on error
  }
};

module.exports = sendOtp;
