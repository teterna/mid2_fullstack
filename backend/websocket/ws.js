const jwt = require("jsonwebtoken");
const { WebSocket, WebSocketServer } = require("ws");

const config = require("../config");

function readTokenFromProtocolHeader(req) {
  const header = req.headers["sec-websocket-protocol"];

  if (!header) {
    return null;
  }

  return header
    .split(",")
    .map((protocol) => protocol.trim())
    .find(Boolean);
}

function rejectUpgrade(socket, statusCode, message) {
  socket.write(`HTTP/1.1 ${statusCode} ${message}\r\n\r\n`);
  socket.destroy();
}

function setupWebSocketServer(server) {
  const wss = new WebSocketServer({
    noServer: true,
    handleProtocols(protocols, req) {
      return req.acceptedProtocol;
    }
  });

  server.on("upgrade", (req, socket, head) => {
    const pathname = new URL(req.url, "http://localhost").pathname;

    if (pathname !== "/ws") {
      rejectUpgrade(socket, 404, "Not Found");
      return;
    }

    const token = readTokenFromProtocolHeader(req);

    if (!token) {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    try {
      req.user = jwt.verify(token, config.jwtSecret);
      req.acceptedProtocol = token;
    } catch (error) {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.user = req.user;
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws) => {
    ws.on("error", console.error);
  });

  function broadcast(messageObject) {
    const message = JSON.stringify({
      ...messageObject
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  function broadcastTickerUpdate(ticker, price) {
    broadcast({
      type: "TICKER_UPDATE",
      payload: {
        ticker,
        price
      }
    });
  }

  function broadcastStockCreated(stock) {
    broadcast({
      type: "STOCK_CREATED",
      payload: {
        stock
      }
    });
  }

  function broadcastStockDeleted(ticker) {
    broadcast({
      type: "STOCK_DELETED",
      payload: {
        ticker
      }
    });
  }

  return {
    broadcastStockCreated,
    broadcastStockDeleted,
    broadcastTickerUpdate
  };
}

module.exports = {
  setupWebSocketServer
};
