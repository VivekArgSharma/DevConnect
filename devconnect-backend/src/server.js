// devconnect-backend/src/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import adminRoutes from "./routes/adminPostRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { registerChatSockets } from "./sockets/chat.socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

/* -------------------- SOCKET.IO -------------------- */
const io = new Server(server, {
  cors: {
    origin: "*", // OK for dev
    methods: ["GET", "POST"],
  },
});

/* -------------------- EXPRESS CORS -------------------- */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:8080",
      "https://devconnect.lovable.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ SAFE PREFLIGHT HANDLER (FIXED)
app.options(/.*/, cors());

app.use(express.json());

/* -------------------- HEALTH -------------------- */
app.get("/", (req, res) => {
  res.json({ message: "DevConnect backend running" });
});

/* -------------------- ROUTES -------------------- */
app.use("/api", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

// ✅ CHAT REST ROUTES (no /api prefix)
app.use(chatRoutes);

/* -------------------- SOCKETS -------------------- */
registerChatSockets(io);

/* -------------------- START SERVER -------------------- */
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 DevConnect backend + chat running on port ${PORT}`);
});
