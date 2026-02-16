import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { username: user.username, firstname: user.firstname, lastname: user.lastname },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { username, firstname, lastname, password } = req.body;

    if (!username || !firstname || !lastname || !password) {
      return res.status(400).json({ ok: false, error: "All fields are required." });
    }

    const existing = await User.findOne({ username }).lean();
    if (existing) {
      return res.status(409).json({ ok: false, error: "Username already exists." });
    }

    const user = await User.create({ username, firstname, lastname, password });
    return res.status(201).json({ ok: true, user: { username, firstname, lastname } });
  } catch (err) {
    // Handle unique index errors too
    return res.status(400).json({ ok: false, error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "Username and password are required." });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ ok: false, error: "Invalid credentials." });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ ok: false, error: "Invalid credentials." });

    const token = signToken(user);
    return res.json({
      ok: true,
      token,
      user: { username: user.username, firstname: user.firstname, lastname: user.lastname }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Server error." });
  }
});

export default router;
