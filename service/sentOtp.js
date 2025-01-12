const axios = require("axios");

let isSent = false;
const sendOtp = async (phoneNumber, otp) => {
  const url = "https://api.managepoint.co/api/sms/send";

  // payload to send
  const payload = {
    // apiKey: '8d6ad695-1dff-4c9e-9eb4-b6ba8f4465ee',
    apiKey: "c1c5427b-6c19-4f42-a534-7c0e4d550659",
    to: phoneNumber,
    message: `Your OTP is ${otp}`,
  };

  // setting state
  try {
    const res = await axios.post(url, payload);
    if (res.status === 2000) {
      isSent = true;
    }
  } catch (error) {
    console.log("Error in sending otp", error.message);
  }

  return isSent;
};

module.exports = sendOtp;
