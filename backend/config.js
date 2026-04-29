require("dotenv").config();

const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pex",
  jwtSecret: process.env.JWT_SECRET || "local_pex_secret_change_me",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173"
};

module.exports = config;

