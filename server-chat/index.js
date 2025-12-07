// index.js - Express + Socket.io chat server for DevConnect (FINAL FIXED)

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

// ---------- SUPABASE ADMIN AUTH CLIENT ----------
const supabaseAdminAuth = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  }
);

// ---------- JWT VALIDATION ----------
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

// ---------- ROUTES ----------

app.get("/", (req, res) => res.send({ ok: true }));

// ✅ OPEN OR CREATE DM (now also "undeletes" for current user)
app.post("/chat/open", async (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const user = await supabaseGetUser(token);

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const userId = user.id;
  const otherUserId = req.body.other_user_id;

  try {
    const { rows } = await pool.query(
      `
      SELECT c.id 
      FROM public.chats c
      WHERE c.is_group = false
      AND EXISTS (SELECT 1 FROM public.chat_participants cp WHERE cp.chat_id = c.id AND cp.user_id = $1)
      AND EXISTS (SELECT 1 FROM public.chat_participants cp WHERE cp.chat_id = c.id AND cp.user_id = $2)
      AND (SELECT COUNT(*) FROM public.chat_participants cp WHERE cp.chat_id = c.id) = 2
      LIMIT 1
    `,
      [userId, otherUserId]
    );

    let chatId;

    if (rows.length) {
      chatId = rows[0].id;

      // ✅ If user had deleted this chat before, bring it back for them
      await pool.query(
        `UPDATE public.chat_participants
         SET is_deleted = false
         WHERE chat_id = $1 AND user_id = $2`,
        [chatId, userId]
      );
    } else {
      await pool.query("BEGIN");

      const created = await pool.query(
        `INSERT INTO public.chats (is_group) VALUES (false) RETURNING id`
      );
      chatId = created.rows[0].id;

      await pool.query(
        `INSERT INTO public.chat_participants (chat_id, user_id, is_deleted)
         VALUES ($1,$2,false), ($1,$3,false)`,
        [chatId, userId, otherUserId]
      );

      await pool.query("COMMIT");
    }

    res.json({ chat_id: chatId });
  } catch (err) {
    console.error("OPEN CHAT ERROR:", err);
    try {
      await pool.query("ROLLBACK");
    } catch {}
    res.status(500).json({ error: "server_error" });
  }
});

// ✅ FETCH MESSAGES
app.get("/chat/:chatId/messages", async (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const user = await supabaseGetUser(token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { rows } = await pool.query(
      `
      SELECT 
        m.id, m.chat_id, m.sender_id, m.content, m.attachments, m.created_at,
        p.full_name AS sender_name,
        p.avatar_url
      FROM public.messages m
      LEFT JOIN public.profiles p ON p.id = m.sender_id
      WHERE m.chat_id = $1
      ORDER BY m.created_at ASC
    `,
      [req.params.chatId]
    );

    res.json({ messages: rows });
  } catch (err) {
    console.error("FETCH MESSAGES ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// ✅ PER-USER DELETE CHAT (WhatsApp-style)
app.delete("/chat/:chatId", async (req, res) => {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const user = await supabaseGetUser(token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const chatId = req.params.chatId;

  try {
    // Check that this user is a participant
    const part = await pool.query(
      `SELECT 1 FROM public.chat_participants WHERE chat_id = $1 AND user_id = $2`,
      [chatId, user.id]
    );

    if (!part.rowCount)
      return res.status(403).json({ error: "not_participant" });

    // ✅ Soft delete only for this user
    await pool.query(
      `UPDATE public.chat_participants
       SET is_deleted = true
       WHERE chat_id = $1 AND user_id = $2`,
      [chatId, user.id]
    );

    // ✅ If no one else still has this chat → hard delete everything
    const remaining = await pool.query(
      `SELECT COUNT(*) AS cnt
       FROM public.chat_participants
       WHERE chat_id = $1 AND is_deleted = false`,
      [chatId]
    );

    const stillActive = Number(remaining.rows[0].cnt);

    if (stillActive === 0) {
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
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE CHAT ERROR:", err);
    try {
      await pool.query("ROLLBACK");
    } catch {}
    res.status(500).json({ error: "server_error" });
  }
});

// ✅ GET ACTIVE CHATS LIST (for /chats page)
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
        m.created_at AS last_message_time
      FROM public.chats c
      JOIN public.chat_participants cp1 
        ON cp1.chat_id = c.id 
       AND cp1.user_id = $1
       AND cp1.is_deleted = false       -- ✅ only chats not deleted by this user
      JOIN public.chat_participants cp2 
        ON cp2.chat_id = c.id 
       AND cp2.user_id != cp1.user_id
      JOIN public.profiles p 
        ON p.id = cp2.user_id
      JOIN LATERAL (
        SELECT content, created_at
        FROM public.messages
        WHERE chat_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      ORDER BY m.created_at DESC
    `,
      [user.id]
    );

    res.json({ chats: rows });
  } catch (err) {
    console.error("FETCH CHATS ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

// ---------- SOCKET ----------
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ✅ SOCKET AUTH
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

  // ✅ join only chats this user hasn't deleted
  (async () => {
    const { rows } = await pool.query(
      `SELECT chat_id 
       FROM public.chat_participants 
       WHERE user_id = $1 AND is_deleted = false`,
      [user.id]
    );
    rows.forEach((r) => socket.join(r.chat_id));
  })();

  // ✅ TYPING INDICATOR
  socket.on("typing", ({ chat_id, isTyping }) => {
    io.to(chat_id).emit("typing_status", {
      chat_id,
      user_id: user.id,
      isTyping,
    });
  });

  // ✅ SEND MESSAGE
  socket.on("send_message", async (payload, ack) => {
    try {
      const { rows } = await pool.query(
        `
        INSERT INTO public.messages (chat_id, sender_id, content)
        VALUES ($1,$2,$3) RETURNING *
      `,
        [payload.chat_id, user.id, payload.content]
      );

      const message = rows[0];

      io.to(payload.chat_id).emit("message", {
        ...message,
        sender_name: user.user_metadata?.full_name || null,
      });

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

// ✅ START SERVER
server.listen(PORT, () => {
  console.log(`✅ Chat server running on port ${PORT}`);
});

module.exports = { app, server, io };
