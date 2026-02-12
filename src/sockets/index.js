import jwt from "jsonwebtoken";
import { GroupMessage } from "../models/GroupMessage.js";
import { PrivateMessage } from "../models/PrivateMessage.js";
import {
  setUserSocket,
  removeUserSocket,
  getSocketIdByUser,
  joinRoom,
  leaveRoom,
  getOnlineUsersInRoom
} from "./state.js";

function formatDate(d) {
  // ISO string is great for machines; we keep it readable for the UI too.
  return new Date(d).toLocaleString();
}

export function attachSockets(io) {
  // Socket auth: expect JWT in handshake auth
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing token"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload;
      return next();
    } catch (err) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const username = socket.user.username;
    setUserSocket(username, socket.id);

    socket.emit("ready", { ok: true, user: socket.user });

    socket.on("join_room", async ({ room }) => {
      if (!room) return;

      // Leave previous rooms (except private room for this socket)
      for (const r of socket.rooms) {
        if (r !== socket.id) socket.leave(r);
      }

      socket.join(room);
      joinRoom(username, room);

      // Notify room
      socket.to(room).emit("system", {
        room,
        message: `${username} joined the room.`,
        at: formatDate(Date.now())
      });

      // Send updated user list
      io.to(room).emit("room_users", { room, users: getOnlineUsersInRoom(room) });
    });

    socket.on("leave_room", ({ room }) => {
      if (!room) return;
      socket.leave(room);
      leaveRoom(username, room);

      socket.to(room).emit("system", {
        room,
        message: `${username} left the room.`,
        at: formatDate(Date.now())
      });
      io.to(room).emit("room_users", { room, users: getOnlineUsersInRoom(room) });
    });

    socket.on("group_message", async ({ room, message }) => {
      if (!room || !message?.trim()) return;
      const doc = await GroupMessage.create({
        from_user: username,
        room,
        message: message.trim()
      });

      io.to(room).emit("group_message", {
        _id: doc._id,
        from_user: doc.from_user,
        room: doc.room,
        message: doc.message,
        date_sent: doc.date_sent,
        date_sent_text: formatDate(doc.date_sent)
      });
    });

    socket.on("private_message", async ({ to_user, message }) => {
      if (!to_user || !message?.trim()) return;

      const doc = await PrivateMessage.create({
        from_user: username,
        to_user,
        message: message.trim()
      });

      const payload = {
        _id: doc._id,
        from_user: doc.from_user,
        to_user: doc.to_user,
        message: doc.message,
        date_sent: doc.date_sent,
        date_sent_text: formatDate(doc.date_sent)
      };

      // deliver to receiver if online
      const toSocketId = getSocketIdByUser(to_user);
      if (toSocketId) io.to(toSocketId).emit("private_message", payload);

      // deliver back to sender for UI sync
      socket.emit("private_message", payload);
    });

    // Typing indicator in a room
    socket.on("typing_room", ({ room, isTyping }) => {
      if (!room) return;
      socket.to(room).emit("typing_room", { room, from_user: username, isTyping: !!isTyping });
    });

    // Typing indicator in private chat (1-to-1)
    socket.on("typing_private", ({ to_user, isTyping }) => {
      if (!to_user) return;
      const toSocketId = getSocketIdByUser(to_user);
      if (toSocketId) {
        io.to(toSocketId).emit("typing_private", { from_user: username, isTyping: !!isTyping });
      }
    });

    socket.on("disconnect", () => {
      removeUserSocket(username);
      // Remove from all rooms tracked in memory
      for (const room of Array.from(socket.rooms)) {
        if (room !== socket.id) {
          leaveRoom(username, room);
          io.to(room).emit("room_users", { room, users: getOnlineUsersInRoom(room) });
          socket.to(room).emit("system", {
            room,
            message: `${username} disconnected.`,
            at: formatDate(Date.now())
          });
        }
      }
    });
  });
}
