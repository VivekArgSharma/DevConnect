// src/server.js
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
import adminRoutes from "./routes/adminRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { registerChatSockets } from "./sockets/chat.socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

/* -----------------------------------------------------
   ✅ CORS — CORRECT + NODE 22 SAFE
----------------------------------------------------- */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
  "https://devconnect.lovable.app",
  "https://dev-connect-pi-opal.vercel.app", // ✅ Vercel frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server or curl requests (no origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ❗ DO NOT ADD app.options() — cors() handles it */

app.use(express.json());

/* -----------------------------------------------------
   HEALTH
----------------------------------------------------- */
app.get("/", (req, res) => {
  res.json({ message: "DevConnect backend running" });
});

/* -----------------------------------------------------
   ROUTES
----------------------------------------------------- */
app.use("/api", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminRoutes);

// chat REST routes
app.use("/api", chatRoutes);

/* -----------------------------------------------------
   SOCKET.IO
----------------------------------------------------- */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

registerChatSockets(io);

/* -----------------------------------------------------
   START
----------------------------------------------------- */
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 DevConnect backend running on port ${PORT}`);
});
