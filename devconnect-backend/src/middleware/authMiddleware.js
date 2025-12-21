import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { supabaseAdmin } from "../config/supabaseClient.js";

dotenv.config();

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization token" });
  }

  const token = authHeader.split(" ")[1];

  let payload;
  try {
    // 1️⃣ Verify JWT cryptographically
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  try {
    // 2️⃣ Validate user against Supabase (CRITICAL)
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "User session invalid" });
    }

    // 3️⃣ Attach clean user object
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
    };

    next();
  } catch (err) {
    console.error("Supabase user validation failed:", err);
    return res.status(401).json({ error: "Authentication failed" });
  }
}
