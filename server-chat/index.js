// server-chat/index.js - DevConnect Chat Server (DM + Unread + Per-user Delete)

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

// ---------- DB ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ---------- SUPABASE ADMIN ----------
const supabaseAdminAuth = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ---------- AUTH ----------
async function supabaseGetUser(token) {
  if (!token) return null;
  try {
    const { data, error } = await supabaseAdminAuth.auth.getUser(token);
    if (error) {
      console.error("JWT validation error:", error);
      return null;
    }
    return data.user;
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return null;
  }
}

// ---------- HEALTH ----------
app.get("/", (req, res) => res.send({ ok: true }));

// ---------- OPEN CHAT (RESTORE IF DELETED) ----------
app.post("/chat/open", async (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const user = await supabaseGetUser(token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { other_user_id } = req.body;
  if (!other_user_id) {
    return res.status(400).json({ error: "other_user_id required" });
  }

  try {
    // Try to find existing DM
    const { rows } = await pool.query(
      `
      SELECT c.id 
      FROM chats c
      JOIN chat_participants a ON a.chat_id = c.id
      JOIN chat_participants b ON b.chat_id = c.id
      WHERE a.user_id = $1 AND b.user_id = $2 AND c.is_group = false
      LIMIT 1
      `,
      [user.id, other_user_id]
    );

    let chatId;

    if (rows.length) {
      chatId = rows[0].id;
      // If user had deleted this chat, bring it back
      await pool.query(
        `UPDATE chat_participants
         SET is_deleted = false
         WHERE chat_id = $1 AND user_id = $2`,
        [chatId, user.id]
      );
    } else {
      // Create DM chat
      const created = await pool.query(
        `INSERT INTO chats (is_group) VALUES (false) RETURNING id`
      );
      chatId = created.rows[0].id;

      await pool.query(
        `INSERT INTO chat_participants (chat_id, user_id)
         VALUES ($1,$2),($1,$3)`,
        [chatId, user.id, other_user_id]
      );
    }

    return res.json({ chat_id: chatId });
  } catch (err) {
    console.error("OPEN CHAT ERROR:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ---------- FETCH MESSAGES + MARK READ ----------
app.get("/chat/:chatId/messages", async (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const user = await supabaseGetUser(token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const chatId = req.params.chatId;

  try {
    // Get messages
    const { rows } = await pool.query(
      `
      SELECT 
        m.id,
        m.chat_id,
        m.sender_id,
        m.content,
        m.attachments,
        m.created_at,
        p.full_name AS sender_name,
        p.avatar_url
      FROM messages m
      LEFT JOIN profiles p ON p.id = m.sender_id
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC
      `,
      [chatId]
    );

    // Mark as read for this user
    await pool.query(
      `
      UPDATE chat_participants
      SET last_read_at = now(), is_deleted = false
      WHERE chat_id = $1 AND user_id = $2
      `,
      [chatId, user.id]
    );

    return res.json({ messages: rows });
  } catch (err) {
    console.error("FETCH MESSAGES ERROR:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ---------- PER-USER DELETE CHAT ----------
app.delete("/chat/:chatId", async (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const user = await supabaseGetUser(token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const chatId = req.params.chatId;

  try {
    // Soft delete only for this user
    await pool.query(
      `
      UPDATE chat_participants
      SET is_deleted = true
      WHERE chat_id = $1 AND user_id = $2
      `,
      [chatId, user.id]
    );

    // If no other participant still has it, hard delete
    const remaining = await pool.query(
      `
      SELECT COUNT(*) AS cnt
      FROM chat_participants
      WHERE chat_id = $1 AND is_deleted = false
      `,
      [chatId]
    );

    const stillActive = Number(remaining.rows[0].cnt);

    if (stillActive === 0) {
      await pool.query(`DELETE FROM messages WHERE chat_id = $1`, [chatId]);
      await pool.query(`DELETE FROM chat_participants WHERE chat_id = $1`, [
        chatId,
      ]);
      await pool.query(`DELETE FROM chats WHERE id = $1`, [chatId]);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("DELETE CHAT ERROR:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ---------- CHATS LIST + UNREAD COUNT ----------
app.get("/chats", async (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const user = await supabaseGetUser(token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { rows } = await pool.query(
      `
      SELECT
        c.id AS chat_id,
        p.id AS other_user_id,
        p.full_name AS other_user_name,
        p.avatar_url,
        m.content AS last_message,
        m.created_at AS last_message_time,
        (
          SELECT COUNT(*)
          FROM messages msg
          WHERE msg.chat_id = c.id
            AND msg.sender_id <> $1
            AND msg.created_at > cp1.last_read_at
        ) AS unread_count
      FROM chats c
      JOIN chat_participants cp1
        ON cp1.chat_id = c.id
       AND cp1.user_id = $1
       AND cp1.is_deleted = false
      JOIN chat_participants cp2
        ON cp2.chat_id = c.id
       AND cp2.user_id <> $1
      JOIN profiles p
        ON p.id = cp2.user_id
      JOIN LATERAL (
        SELECT content, created_at
        FROM messages
        WHERE chat_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      ORDER BY m.created_at DESC
      `,
      [user.id]
    );

    return res.json({ chats: rows });
  } catch (err) {
    console.error("FETCH CHATS ERROR:", err);
    return res.status(500).json({ error: "server_error" });
  }
});

// ---------- SOCKET SERVER ----------
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

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

  // Join all active chats this user participates in
  (async () => {
    try {
      const { rows } = await pool.query(
        `
        SELECT chat_id
        FROM chat_participants
        WHERE user_id = $1 AND is_deleted = false
        `,
        [user.id]
      );
      rows.forEach((r) => socket.join(r.chat_id));
    } catch (err) {
      console.error("Error joining rooms:", err);
    }
  })();

  // Incoming message
  socket.on("send_message", async (payload, ack) => {
    try {
      const { chat_id, content } = payload;
      if (!chat_id || !content) {
        ack?.({ error: "invalid_payload" });
        return;
      }

      const { rows } = await pool.query(
        `
        INSERT INTO messages (chat_id, sender_id, content)
        VALUES ($1,$2,$3) RETURNING *
        `,
        [chat_id, user.id, content]
      );

      const message = rows[0];

      io.to(chat_id).emit("message", message);
      ack?.({ ok: true, message });
    } catch (err) {
      console.error("send_message error:", err);
      ack?.({ error: "server_error" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Chat server running on port ${PORT}`);
});

module.exports = { app, server, io };
