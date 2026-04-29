const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");

const config = require("../config");
const auth = require("../middleware/auth");
const User = require("../models/User");
const { formatUser } = require("../utils/format");

const router = express.Router();

function makeToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email
    },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: "Name, email and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409).json({ message: "This email is already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      walletBalance: 10000
    });

    res.status(201).json({
      token: makeToken(user),
      user: formatUser(user)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not register user" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const passwordIsCorrect = await bcrypt.compare(password, user.passwordHash);

    if (!passwordIsCorrect) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    res.json({
      token: makeToken(user),
      user: formatUser(user)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not log in" });
  }
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({ user: formatUser(user) });
});

module.exports = router;

