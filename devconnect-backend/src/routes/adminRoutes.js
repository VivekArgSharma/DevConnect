import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { supabaseAdmin } from "../config/supabaseClient.js";

const router = express.Router();

/* -----------------------------------------------------
   GET POSTS (pending / approved / rejected)
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

    res.json(data ?? []);
  } catch (err) {
    console.error("Unexpected admin fetch error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   UPDATE POST STATUS
   PATCH /api/admin/posts/:id/status
----------------------------------------------------- */
router.patch(
  "/posts/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const { status, reason } = req.body;
      const postId = req.params.id;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updateData = {
        status,
        reviewed_by: req.user.id,
        reviewed_at: new Date(),
      };

      if (status === "rejected") {
        updateData.rejection_reason = reason || null;
      }

      const { data, error } = await supabaseAdmin
        .from("posts")
        .update(updateData)
        .eq("id", postId)
        .select()
        .single();

      if (error || !data) {
        console.error("Status update error:", error);
        return res.status(500).json({ error: "Failed to update status" });
      }

      // 🔔 notification
      await supabaseAdmin.from("notifications").insert({
        user_id: data.user_id,
        sender_id: req.user.id,
        type: status === "approved" ? "post_approved" : "post_rejected",
        message:
          status === "approved"
            ? `Your ${data.type} "${data.title}" was approved 🎉`
            : `Your ${data.type} "${data.title}" was rejected`,
        related_post: data.id,
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Unexpected status update error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
