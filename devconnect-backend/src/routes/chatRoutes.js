import express from "express";
import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

/* -------------------- DB -------------------- */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/* -------------------- SUPABASE ADMIN -------------------- */
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/* -------------------- AUTH HELPER -------------------- */
async function getUser(req) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error) return null;
    return data.user;
  } catch {
    return null;
  }
}

/* ======================================================
   OPEN CHAT (CREATE OR RESTORE DM)
====================================================== */
router.post("/chat/open", async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { other_user_id } = req.body;
  if (!other_user_id) {
    return res.status(400).json({ error: "other_user_id required" });
  }

  try {
    // Check if DM already exists
    const { rows } = await pool.query(
      `
      SELECT c.id
      FROM chats c
      JOIN chat_participants a ON a.chat_id = c.id
      JOIN chat_participants b ON b.chat_id = c.id
      WHERE a.user_id = $1
        AND b.user_id = $2
        AND c.is_group = false
      LIMIT 1
      `,
      [user.id, other_user_id]
    );

    let chatId;

    if (rows.length) {
      chatId = rows[0].id;

      // Restore chat if user had deleted it
      await pool.query(
        `
        UPDATE chat_participants
        SET is_deleted = false
        WHERE chat_id = $1 AND user_id = $2
        `,
        [chatId, user.id]
      );
    } else {
      // Create new DM
      const created = await pool.query(
        `INSERT INTO chats (is_group) VALUES (false) RETURNING id`
      );

      chatId = created.rows[0].id;

      await pool.query(
        `
        INSERT INTO chat_participants (chat_id, user_id)
        VALUES ($1, $2), ($1, $3)
        `,
        [chatId, user.id, other_user_id]
      );
    }

    res.json({ chat_id: chatId });
  } catch (err) {
    console.error("OPEN CHAT ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/* ======================================================
   FETCH MESSAGES + MARK READ
====================================================== */
router.get("/chat/:chatId/messages", async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { chatId } = req.params;

  try {
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

    res.json({ messages: rows });
  } catch (err) {
    console.error("FETCH MESSAGES ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/* ======================================================
   CHAT LIST + UNREAD COUNT
====================================================== */
router.get("/chats", async (req, res) => {
  const user = await getUser(req);
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

    res.json({ chats: rows });
  } catch (err) {
    console.error("FETCH CHATS ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

/* ======================================================
   PER-USER DELETE CHAT
====================================================== */
router.delete("/chat/:chatId", async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { chatId } = req.params;

  try {
    // Soft delete for this user
    await pool.query(
      `
      UPDATE chat_participants
      SET is_deleted = true
      WHERE chat_id = $1 AND user_id = $2
      `,
      [chatId, user.id]
    );

    // If nobody has it active, hard delete
    const remaining = await pool.query(
      `
      SELECT COUNT(*) AS cnt
      FROM chat_participants
      WHERE chat_id = $1 AND is_deleted = false
      `,
      [chatId]
    );

    if (Number(remaining.rows[0].cnt) === 0) {
      await pool.query(`DELETE FROM messages WHERE chat_id = $1`, [chatId]);
      await pool.query(`DELETE FROM chat_participants WHERE chat_id = $1`, [
        chatId,
      ]);
      await pool.query(`DELETE FROM chats WHERE id = $1`, [chatId]);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE CHAT ERROR:", err);
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
