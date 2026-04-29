const express = require("express");
const mongoose = require("mongoose");

const auth = require("../middleware/auth");
const Stock = require("../models/Stock");
const User = require("../models/User");
const { formatStock, formatUser, roundMoney } = require("../utils/format");

const router = express.Router();

function cleanTicker(value) {
  return String(value || "")
    .trim()
    .replace(/^\$/, "")
    .toUpperCase();
}

function cleanShares(value) {
  const shares = Number(value);

  if (!Number.isInteger(shares) || shares <= 0) {
    return null;
  }

  return shares;
}

function requestError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

router.post("/buy", auth, async (req, res) => {
  const ticker = cleanTicker(req.body.ticker);
  const shares = cleanShares(req.body.shares);

  if (!ticker || !shares) {
    res.status(400).json({ message: "Ticker and a positive whole number of shares are required" });
    return;
  }

  const session = await mongoose.startSession();

  try {
    let updatedUser;
    let tradedStock;

    await session.withTransaction(async () => {
      const stock = await Stock.findOne({ ticker }).session(session);

      if (!stock) {
        throw requestError(404, "Stock not found");
      }

      const buyer = await User.findById(req.user.id).session(session);

      if (!buyer) {
        throw requestError(404, "User not found");
      }

      const totalCost = roundMoney(stock.price * shares);

      if (buyer.walletBalance < totalCost) {
        throw requestError(400, "Not enough wallet balance");
      }

      buyer.walletBalance = roundMoney(buyer.walletBalance - totalCost);

      const existingHolding = buyer.holdings.find((holding) => holding.ticker === ticker);

      if (existingHolding) {
        existingHolding.shares += shares;
      } else {
        buyer.holdings.push({ ticker, shares });
      }

      await buyer.save({ session });
      await stock.populate("owner", "name");

      updatedUser = formatUser(buyer);
      tradedStock = formatStock(stock);
    });

    res.json({
      message: `Bought ${shares} share(s) of ${ticker}`,
      user: updatedUser,
      stock: tradedStock
    });
  } catch (error) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }

    console.error(error);
    res.status(500).json({ message: "Could not buy shares" });
  } finally {
    session.endSession();
  }
});

router.post("/sell", auth, async (req, res) => {
  const ticker = cleanTicker(req.body.ticker);
  const shares = cleanShares(req.body.shares);

  if (!ticker || !shares) {
    res.status(400).json({ message: "Ticker and a positive whole number of shares are required" });
    return;
  }

  const session = await mongoose.startSession();

  try {
    let updatedUser;
    let tradedStock;

    await session.withTransaction(async () => {
      const stock = await Stock.findOne({ ticker }).session(session);

      if (!stock) {
        throw requestError(404, "Stock not found");
      }

      const seller = await User.findById(req.user.id).session(session);

      if (!seller) {
        throw requestError(404, "User not found");
      }

      const existingHolding = seller.holdings.find((holding) => holding.ticker === ticker);

      if (!existingHolding || existingHolding.shares < shares) {
        throw requestError(400, "You do not have enough shares to sell");
      }

      const totalReturn = roundMoney(stock.price * shares);

      seller.walletBalance = roundMoney(seller.walletBalance + totalReturn);
      existingHolding.shares -= shares;
      seller.holdings = seller.holdings.filter((holding) => holding.shares > 0);

      await seller.save({ session });
      await stock.populate("owner", "name");

      updatedUser = formatUser(seller);
      tradedStock = formatStock(stock);
    });

    res.json({
      message: `Sold ${shares} share(s) of ${ticker}`,
      user: updatedUser,
      stock: tradedStock
    });
  } catch (error) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }

    console.error(error);
    res.status(500).json({ message: "Could not sell shares" });
  } finally {
    session.endSession();
  }
});

module.exports = router;

