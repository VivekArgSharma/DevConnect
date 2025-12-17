import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { supabaseAdmin } from "../config/supabaseClient.js";

const router = express.Router();

/* -----------------------------------------------------
   GET ALL PENDING POSTS
----------------------------------------------------- */
router.get("/posts/pending", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch pending posts error:", error);
      return res.status(500).json({ error: "Failed to fetch pending posts" });
    }

    res.json(data ?? []);
  } catch (err) {
    console.error("Unexpected pending posts error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   APPROVE POST
----------------------------------------------------- */
router.post(
  "/posts/:id/approve",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const postId = req.params.id;

      const { data, error } = await supabaseAdmin
        .from("posts")
        .update({
          status: "approved",
          reviewed_by: req.user.id,
          reviewed_at: new Date(),
        })
        .eq("id", postId)
        .select()
        .single();

      if (error || !data) {
        console.error("Approve post error:", error);
        return res.status(500).json({ error: "Failed to approve post" });
      }

      // ✅ USER NOTIFICATION
      await supabaseAdmin.from("notifications").insert({
        user_id: data.user_id,
        sender_id: req.user.id,
        type: "post_approved",
        message: `Your ${data.type} "${data.title}" was approved 🎉`,
        related_post: data.id,
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Unexpected approve error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/* -----------------------------------------------------
   REJECT POST
----------------------------------------------------- */
router.post(
  "/posts/:id/reject",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const postId = req.params.id;
      const { reason } = req.body;

      const { data, error } = await supabaseAdmin
        .from("posts")
        .update({
          status: "rejected",
          reviewed_by: req.user.id,
          reviewed_at: new Date(),
          rejection_reason: reason || null,
        })
        .eq("id", postId)
        .select()
        .single();

      if (error || !data) {
        console.error("Reject post error:", error);
        return res.status(500).json({ error: "Failed to reject post" });
      }

      // ✅ USER NOTIFICATION
      await supabaseAdmin.from("notifications").insert({
        user_id: data.user_id,
        sender_id: req.user.id,
        type: "post_rejected",
        message: `Your ${data.type} "${data.title}" was rejected`,
        related_post: data.id,
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Unexpected reject error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
