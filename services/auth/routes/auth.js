const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Driver = require("../models/Driver");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = 10;

/**
 * Register rider
 * POST /auth/register
 * body: { name, phone, password }
 */
router.post("/register", async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password)
  return res.status(400).json({ message: "Missing fields" });

// Phone validation (Indian format)
const phoneRegex = /^[6-9]\d{9}$/;
if (!phoneRegex.test(phone))
  return res.status(400).json({ message: "Invalid phone number. Must be 10 digits starting with 6-9." });

    const existing = await User.findOne({ phone });
    if (existing) return res.status(409).json({ message: "Phone already registered" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ name, phone, password: hashed });

    res.status(201).json({ message: "User created", userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Register driver
 * POST /auth/driver/register
 * body: { name, phone, password, vehicle }
 */
router.post("/driver/register", async (req, res) => {
  try {
    const { name, phone, password, vehicle } = req.body;
    if (!name || !phone || !password)
  return res.status(400).json({ message: "Missing fields" });

// Phone validation (Indian format)
const phoneRegex = /^[6-9]\d{9}$/;
if (!phoneRegex.test(phone))
  return res.status(400).json({ message: "Invalid phone number. Must be 10 digits starting with 6-9." });

    const existing = await Driver.findOne({ phone });
    if (existing) return res.status(409).json({ message: "Phone already registered" });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const driver = await Driver.create({ name, phone, password: hashed, vehicle });

    res.status(201).json({ message: "Driver created", driverId: driver._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Login (rider or driver)
 * POST /auth/login
 * body: { phone, password, role } role: "user" | "driver"
 */
router.post("/login", async (req, res) => {
  try {
    const { phone, password, role } = req.body;
    if (!phone || !password || !role)
  return res.status(400).json({ message: "Missing fields" });

// Validate phone
const phoneRegex = /^[6-9]\d{9}$/;
if (!phoneRegex.test(phone))
  return res.status(400).json({ message: "Invalid phone number format." });

    let account;
    if (role === "user") account = await User.findOne({ phone });
    else if (role === "driver") account = await Driver.findOne({ phone });
    else return res.status(400).json({ message: "Invalid role" });

    if (!account) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, account.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const payload = {
      id: account._id,
      role: role === "user" ? "rider" : "driver",
      phone: account.phone
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      token,
      user: payload,         // legacy shape kept for compatibility
      userId: payload.id,    // explicit id field frontend can always rely on
      role: payload.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * Protected route to get current profile
 * GET /auth/me
 * Authorization: Bearer <token>
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role === "rider") {
      const user = await User.findById(id).select("-password");
      return res.json({ role, profile: user });
    } else {
      const driver = await Driver.findById(id).select("-password");
      return res.json({ role, profile: driver });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
