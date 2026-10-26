
const axios = require("axios");

const sendSmsOtp = async (phone, otp) => {
  if (!process.env.MSG91_AUTH_KEY || !process.env.MSG91_TEMPLATE_ID) {
    throw new Error("MSG91 environment variables are missing");
  }

  const response = await axios.post(
    "https://control.msg91.com/api/v5/otp",
    {
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: phone,
      otp: otp
    },
    {
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        "Content-Type": "application/json"
      },
      timeout: 15000
    }
  );

  return response.data;
};

module.exports = sendSmsOtp;
