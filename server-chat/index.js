// index.js - Express + Socket.io chat server for DevConnect (FULL FIXED VERSION)

require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { Pool } = require("pg");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- ENV ----------
const PORT = process.env.PORT || 4000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Chat server running with:");
console.log("SUPABASE_URL:", SUPABASE_URL);

// ---------- PG CONNECTION ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ---------- FIXED: Supabase Admin Auth Client ----------
const supabaseAdminAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------- FIXED JWT VALIDATION ----------
async function supabaseGetUser(token) {
  if (!token) return null;

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdminAuth.auth.getUser(token);

    if (error) {
      console.error("JWT validation error:", error);
      return null;
    }

    return user; // Contains user.id
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return null;
  }
}

// ---------- ROUTES ----------

// Health route
app.get("/", (req, res) => res.send({ ok: true }));

/**
 * OPEN OR CREATE DM CHAT
 * POST /chat/open
 */
app.post("/chat/open", async (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const user = await supabaseGetUser(token);

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const userId = user.id;
  const otherUserId = req.body.other_user_id;

  if (!otherUserId)
    return res.status(400).json({ error: "other_user_id required" });

  try {
    // Find if DM chat already exists
    const findChatQuery = `
      SELECT c.id 
      FROM public.chats c
      WHERE c.is_group = false
      AND EXISTS (
        SELECT 1 FROM public.chat_participants cp 
        WHERE cp.chat_id = c.id AND cp.user_id = $1
      )
      AND EXISTS (
        SELECT 1 FROM public.chat_participants cp 
        WHERE cp.chat_id = c.id AND cp.user_id = $2
      )
      AND (
        SELECT COUNT(*) FROM public.chat_participants cp 
        WHERE cp.chat_id = c.id
      ) = 2
      LIMIT 1;
    `;

    const { rows } = await pool.query(findChatQuery, [userId, otherUserId]);

    let chatId;

    if (rows.length > 0) {
      chatId = rows[0].id;
    } else {
      // Create a new chat
      await pool.query("BEGIN");

      const insertChat = await pool.query(
        `INSERT INTO public.chats (is_group) VALUES (false) RETURNING id`
      );

      chatId = insertChat.rows[0].id;

      await pool.query(
        `INSERT INTO public.chat_participants (chat_id, user_id) VALUES ($1, $2), ($1, $3)`,
        [chatId, userId, otherUserId]
      );

      await pool.query("COMMIT");
    }

    return res.json({ chat_id: chatId });
  } catch (err) {
    console.error("OPEN CHAT ERROR:", err);
    try {
      await pool.query("ROLLBACK");
    } catch (_) {}
    return res.status(500).json({ error: "server_error" });
  }
});

/**
 * FETCH MESSAGES
 */
app.get("/chat/:chatId/messages", async (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const user = await supabaseGetUser(token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const chatId = req.params.chatId;

  try {
    const messagesQ = `
      SELECT 
        m.id, m.chat_id, m.sender_id, m.content, m.attachments, m.created_at,
        p.full_name AS sender_name, p.avatar_url
      FROM public.messages m
      LEFT JOIN public.profiles p ON p.id = m.sender_id
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC;
    `;

    const { rows } = await pool.query(messagesQ, [chatId]);

    return res.json({ messages: rows });
  } catch (err) {
    console.error("FETCH MESSAGES ERROR:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

/**
 * DELETE CHAT + MESSAGES
 */
app.delete("/chat/:chatId", async (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const user = await supabaseGetUser(token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const chatId = req.params.chatId;

  try {
    // Check participant
    const part = await pool.query(
      `SELECT 1 FROM public.chat_participants WHERE chat_id = $1 AND user_id = $2 LIMIT 1`,
      [chatId, user.id]
    );
    if (part.rowCount === 0)
      return res.status(403).json({ error: "not_participant" });

    await pool.query("BEGIN");

    await pool.query(`DELETE FROM public.messages WHERE chat_id = $1`, [
      chatId,
    ]);

    await pool.query(
      `DELETE FROM public.chat_participants WHERE chat_id = $1`,
      [chatId]
    );

    await pool.query(`DELETE FROM public.chats WHERE id = $1`, [chatId]);

    await pool.query("COMMIT");

    io.to(chatId).emit("chat_deleted", { chat_id: chatId });

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE CHAT ERROR:", err);
    try {
      await pool.query("ROLLBACK");
    } catch (_) {}
    return res.status(500).json({ error: "server_error" });
  }
});

// ---------- SOCKET.IO ----------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Authenticate socket connection
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  const user = await supabaseGetUser(token);

  if (!user) return next(new Error("unauthorized"));

  socket.user = user;
  next();
});

io.on("connection", (socket) => {
  const user = socket.user;
  console.log("Socket connected:", user.id);

  // Join all chat rooms this user belongs to
  (async () => {
    try {
      const { rows } = await pool.query(
        `SELECT chat_id FROM public.chat_participants WHERE user_id = $1`,
        [user.id]
      );
      rows.forEach((r) => socket.join(r.chat_id));
    } catch (err) {
      console.error("Room join error:", err);
    }
  })();

  // Send message
  socket.on("send_message", async (payload, ack) => {
    const { chat_id, content } = payload;

    if (!chat_id || !content) {
      if (ack) ack({ error: "invalid_payload" });
      return;
    }

    try {
      // Check participant
      const p = await pool.query(
        `SELECT 1 FROM public.chat_participants WHERE chat_id = $1 AND user_id = $2 LIMIT 1`,
        [chat_id, user.id]
      );

      if (p.rowCount === 0) {
        if (ack) ack({ error: "not_participant" });
        return;
      }

      const insertQ = `
        INSERT INTO public.messages (chat_id, sender_id, content, attachments)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;

      const { rows } = await pool.query(insertQ, [
        chat_id,
        user.id,
        content,
        payload.attachments || null,
      ]);

      const message = rows[0];

      // Emit message to room
      io.to(chat_id).emit("message", {
        ...message,
        sender_name: user.user_metadata?.full_name || null,
      });

      if (ack) ack({ ok: true, message });
    } catch (err) {
      console.error("send_message error:", err);
      if (ack) ack({ error: "server_error" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
});

module.exports = { app, server, io };
