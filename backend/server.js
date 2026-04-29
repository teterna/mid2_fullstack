const http = require("http");
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");

const config = require("./config");
const authRoutes = require("./routes/auth");
const stockRoutes = require("./routes/stocks");
const tradeRoutes = require("./routes/trades");
const { setupWebSocketServer } = require("./websocket/ws");

const app = express();
const server = http.createServer(app);
const { broadcastStockCreated, broadcastStockDeleted, broadcastTickerUpdate } =
  setupWebSocketServer(server);

function normalizeOrigin(origin) {
  if (!origin) {
    return "";
  }

  try {
    return new URL(origin.trim()).origin;
  } catch (error) {
    return origin.trim().replace(/\/+$/, "");
  }
}

const allowedOrigins = config.clientUrl
  .split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const fallbackAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://mid2-fullstack.vercel.app"
];

function isAllowedOrigin(origin) {
  const requestOrigin = normalizeOrigin(origin);

  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes("*")) {
    return true;
  }

  if (allowedOrigins.includes(requestOrigin) || fallbackAllowedOrigins.includes(requestOrigin)) {
    return true;
  }

  return requestOrigin.endsWith(".vercel.app");
}

app.locals.broadcastTickerUpdate = broadcastTickerUpdate;
app.locals.broadcastStockCreated = broadcastStockCreated;
app.locals.broadcastStockDeleted = broadcastStockDeleted;
app.use(express.json());
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      console.warn(`Blocked by CORS: ${origin}`);
      callback(null, false);
    }
  })
);

app.get("/api/health", (req, res) => {
  res.json({ message: "PEX backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/trades", tradeRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong on the server" });
});

async function startServer() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("Connected to MongoDB");

    server.listen(config.port, () => {
      console.log(`PEX backend listening on port ${config.port}`);
    });
  } catch (error) {
    console.error("Could not start the server");
    console.error(error);
    process.exit(1);
  }
}

startServer();
