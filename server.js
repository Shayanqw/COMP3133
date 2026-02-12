import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";

import { connectDB } from "./src/config/db.js";
import authRoutes from "./src/routes/auth.js";
import roomsRoutes from "./src/routes/rooms.js";
import usersRoutes from "./src/routes/users.js";
import messagesRoutes from "./src/routes/messages.js";
import { attachSockets } from "./src/sockets/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static frontend
app.use("/view", express.static(path.join(__dirname, "view")));

// API
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/messages", messagesRoutes);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Start
const PORT = process.env.PORT || 3000;

(async () => {
  await connectDB(process.env.MONGO_URI);
  attachSockets(io);

  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`➡️  Open http://localhost:${PORT}/view/login.html`);
  });
})();
