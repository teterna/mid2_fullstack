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

app.locals.broadcastTickerUpdate = broadcastTickerUpdate;
app.locals.broadcastStockCreated = broadcastStockCreated;
app.locals.broadcastStockDeleted = broadcastStockDeleted;
app.use(express.json());
app.use(
  cors({
    origin(origin, callback) {
      const requestOrigin = normalizeOrigin(origin);

      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
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
