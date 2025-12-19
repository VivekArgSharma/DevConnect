import { Pool } from "pg";
import { createClient } from "@supabase/supabase-js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const supabaseAdminAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function supabaseGetUser(token) {
  if (!token) return null;
  const { data, error } = await supabaseAdminAuth.auth.getUser(token);
  if (error) return null;
  return data.user;
}

export function registerChatSockets(io) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    const user = await supabaseGetUser(token);
    if (!user) return next(new Error("unauthorized"));
    socket.user = user;
    next();
  });

  io.on("connection", async (socket) => {
    const user = socket.user;
    console.log("Socket connected:", user.id);

    // Join user chats
    const { rows } = await pool.query(
      `SELECT chat_id FROM chat_participants WHERE user_id=$1 AND is_deleted=false`,
      [user.id]
    );
    rows.forEach(r => socket.join(r.chat_id));

    socket.on("send_message", async (payload, ack) => {
      try {
        const { chat_id, content } = payload;
        const { rows } = await pool.query(
          `INSERT INTO messages (chat_id, sender_id, content)
           VALUES ($1,$2,$3) RETURNING *`,
          [chat_id, user.id, content]
        );

        io.to(chat_id).emit("message", rows[0]);
        ack?.({ ok: true });
      } catch {
        ack?.({ error: "server_error" });
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
}
