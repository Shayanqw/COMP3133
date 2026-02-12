import express from "express";

const router = express.Router();

// Predefined rooms (can be expanded)
export const ROOMS = ["devops", "cloud-computing", "covid19", "sports", "nodeJS", "frontend", "backend"];

// GET /api/rooms
router.get("/", (_req, res) => {
  res.json({ ok: true, rooms: ROOMS });
});

export default router;
