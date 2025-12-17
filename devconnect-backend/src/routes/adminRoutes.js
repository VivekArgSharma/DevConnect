import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { supabaseAdmin } from "../config/supabaseClient.js";

const router = express.Router();

/**
 * GET ALL PENDING POSTS
 */
router.get("/posts/pending", requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json(error);
  res.json(data);
});

/**
 * APPROVE POST
 */
router.post("/posts/:id/approve", requireAuth, requireAdmin, async (req, res) => {
  const postId = req.params.id;

  const { data, error } = await supabase
    .from("posts")
    .update({
      status: "approved",
      reviewed_by: req.user.id,
      reviewed_at: new Date()
    })
    .eq("id", postId)
    .select()
    .single();

  if (error) return res.status(500).json(error);

  await supabase.from("notifications").insert({
    user_id: data.user_id,
    sender_id: req.user.id,
    type: "post_approved",
    message: `Your ${data.type} "${data.title}" was approved 🎉`,
    related_post: data.id
  });

  res.json({ success: true });
});

/**
 * REJECT POST
 */
router.post("/posts/:id/reject", requireAuth, requireAdmin, async (req, res) => {
  const { reason } = req.body;

  const { data, error } = await supabase
    .from("posts")
    .update({
      status: "rejected",
      reviewed_by: req.user.id,
      reviewed_at: new Date(),
      rejection_reason: reason || null
    })
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json(error);

  await supabase.from("notifications").insert({
    user_id: data.user_id,
    sender_id: req.user.id,
    type: "post_rejected",
    message: `Your ${data.type} "${data.title}" was rejected`,
    related_post: data.id
  });

  res.json({ success: true });
});

export default router;
