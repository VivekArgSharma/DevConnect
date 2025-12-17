import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { supabaseAdmin } from "../config/supabaseClient.js";

const router = express.Router();

/**
 * ✅ SET YOUR REAL ADMIN EMAIL HERE
 * MUST EXACTLY MATCH your Supabase account email
 */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/* -----------------------------------------------------
   ADMIN GUARD
----------------------------------------------------- */
function requireAdmin(req, res, next) {
  if (!req.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Admin access only" });
  }

  next();
}

/* -----------------------------------------------------
   GET PENDING POSTS
   GET /api/admin/posts?status=pending
----------------------------------------------------- */
router.get("/posts", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status = "pending" } = req.query;

    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*, profiles(full_name)")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch posts" });
    }

    return res.json(data || []);
  } catch (err) {
    console.error("Unexpected admin fetch error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   APPROVE / REJECT POST
----------------------------------------------------- */
router.patch("/posts/:id/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const postId = req.params.id;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const { error } = await supabaseAdmin
      .from("posts")
      .update({ status })
      .eq("id", postId);

    if (error) {
      console.error("Status update error:", error);
      return res.status(500).json({ error: "Failed to update status" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Unexpected status update error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
