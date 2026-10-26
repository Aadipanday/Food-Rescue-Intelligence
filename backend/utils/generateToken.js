
const jwt = require("jsonwebtoken");

const generateToken = (userId, stage = null) => {
  const payload = { userId };

  if (stage) {
    payload.stage = stage;
  }

  const expiresIn = stage ? "15m" : "7d";

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn
  });
};

module.exports = generateToken;
