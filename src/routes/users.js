import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getOnlineUsersInRoom } from "../sockets/state.js";

const router = express.Router();

// GET /api/users/room/:room (online users)
router.get("/room/:room", requireAuth, (req, res) => {
  const room = req.params.room;
  const users = getOnlineUsersInRoom(room);
  res.json({ ok: true, room, users });
});

export default router;
