const axios = require("axios");

const sendSmsOtp = async (phoneOrObj, maybeOtp) => {
  const phone = typeof phoneOrObj === "object" ? phoneOrObj.phone : phoneOrObj;
  const otp = typeof phoneOrObj === "object" ? phoneOrObj.otp : maybeOtp;

  if (!process.env.MSG91_AUTH_KEY || !process.env.MSG91_TEMPLATE_ID) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV SMS OTP] To: ${phone}, OTP: ${otp}`);
      return { type: "success", message: "OTP simulated in development mode" };
    }
    throw new Error("MSG91 environment variables are missing");
  }

  const response = await axios.post(
    "https://control.msg91.com/api/v5/otp",
    {
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: phone,
      otp: otp,
    },
    {
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    }
  );

  return response.data;
};

module.exports = sendSmsOtp;
