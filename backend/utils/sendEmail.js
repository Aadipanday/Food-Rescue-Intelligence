
const axios = require("axios");

const sendEmail = async ({ to, subject, html }) => {
  if (
    !process.env.BREVO_API_KEY ||
    !process.env.BREVO_SENDER_EMAIL
  ) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n========================================\n[DEV EMAIL SIMULATION]\nTo: ${to}\nSubject: ${subject}\nContent: ${html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()}\n========================================\n`);
      return { messageId: "dev-simulated-email" };
    }
    throw new Error("Brevo environment variables are missing");
  }

  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: process.env.BREVO_SENDER_NAME || "AnnaSetu Intelligence",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      timeout: 15000,
    }
  );

  return response.data;
};

module.exports = sendEmail;
