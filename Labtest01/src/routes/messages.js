import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { GroupMessage } from "../models/GroupMessage.js";
import { PrivateMessage } from "../models/PrivateMessage.js";

const router = express.Router();

// GET /api/messages/group/:room?limit=50
router.get("/group/:room", requireAuth, async (req, res) => {
  const room = req.params.room;
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);

  const msgs = await GroupMessage.find({ room })
    .sort({ date_sent: -1 })
    .limit(limit)
    .lean();

  // return ascending order for UI
  msgs.reverse();
  res.json({ ok: true, room, messages: msgs });
});

// GET /api/messages/private/:other?limit=50
router.get("/private/:other", requireAuth, async (req, res) => {
  const me = req.user.username;
  const other = req.params.other;
  const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);

  const msgs = await PrivateMessage.find({
    $or: [
      { from_user: me, to_user: other },
      { from_user: other, to_user: me }
    ]
  })
    .sort({ date_sent: -1 })
    .limit(limit)
    .lean();

  msgs.reverse();
  res.json({ ok: true, with: other, messages: msgs });
});

export default router;
