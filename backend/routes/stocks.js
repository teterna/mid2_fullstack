const express = require("express");
const mongoose = require("mongoose");

const auth = require("../middleware/auth");
const Stock = require("../models/Stock");
const User = require("../models/User");
const { formatStock, roundMoney } = require("../utils/format");

const router = express.Router();

function cleanTicker(value) {
  return String(value || "")
    .trim()
    .replace(/^\$/, "")
    .toUpperCase();
}

router.get("/", auth, async (req, res) => {
  const stocks = await Stock.find()
    .populate("owner", "name")
    .sort({ ticker: 1 });

  res.json({ stocks: stocks.map(formatStock) });
});

router.post("/", auth, async (req, res) => {
  try {
    const ticker = cleanTicker(req.body.ticker);
    const name = String(req.body.name || "").trim();
    const price = roundMoney(req.body.price);

    if (!/^[A-Z0-9]{2,8}$/.test(ticker)) {
      res.status(400).json({ message: "Ticker must be 2-8 letters or numbers" });
      return;
    }

    if (!name) {
      res.status(400).json({ message: "Company name is required" });
      return;
    }

    if (!price || price <= 0) {
      res.status(400).json({ message: "Price must be greater than zero" });
      return;
    }

    const userAlreadyHasStock = await Stock.findOne({ owner: req.user.id });

    if (userAlreadyHasStock) {
      res.status(409).json({ message: "Each user can create only one stock" });
      return;
    }

    const stock = await Stock.create({
      ticker,
      name,
      price,
      owner: req.user.id
    });

    await stock.populate("owner", "name");
    const createdStock = formatStock(stock);

    req.app.locals.broadcastStockCreated(createdStock);
    res.status(201).json({ stock: createdStock });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ message: "This ticker is already taken" });
      return;
    }

    console.error(error);
    res.status(500).json({ message: "Could not create stock" });
  }
});

router.put("/:ticker/price", auth, async (req, res) => {
  try {
    const ticker = cleanTicker(req.params.ticker);
    const price = roundMoney(req.body.price);

    if (!price || price <= 0) {
      res.status(400).json({ message: "Price must be greater than zero" });
      return;
    }

    const stock = await Stock.findOne({ ticker });

    if (!stock) {
      res.status(404).json({ message: "Stock not found" });
      return;
    }

    if (stock.owner.toString() !== req.user.id) {
      res.status(403).json({ message: "Only the stock owner can change this price" });
      return;
    }

    stock.price = price;
    await stock.save();
    await stock.populate("owner", "name");

    req.app.locals.broadcastTickerUpdate(stock.ticker, stock.price);
    res.json({ stock: formatStock(stock) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not update price" });
  }
});

router.delete("/:ticker", auth, async (req, res) => {
  const ticker = cleanTicker(req.params.ticker);
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const stock = await Stock.findOne({ ticker }).session(session);

      if (!stock) {
        const error = new Error("Stock not found");
        error.status = 404;
        throw error;
      }

      if (stock.owner.toString() !== req.user.id) {
        const error = new Error("Only the stock owner can delete this ticker");
        error.status = 403;
        throw error;
      }

      await Stock.deleteOne({ _id: stock._id }).session(session);
      await User.updateMany({}, { $pull: { holdings: { ticker } } }).session(session);
    });

    req.app.locals.broadcastStockDeleted(ticker);
    res.json({ message: `${ticker} was deleted`, ticker });
  } catch (error) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }

    console.error(error);
    res.status(500).json({ message: "Could not delete stock" });
  } finally {
    session.endSession();
  }
});

module.exports = router;
