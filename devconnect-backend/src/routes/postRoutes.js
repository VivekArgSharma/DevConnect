// src/routes/postRoutes.js

import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { supabaseAdmin } from "../config/supabaseClient.js";

const router = express.Router();

/* -----------------------------------------------------
   CREATE A POST (AUTHENTICATED)
----------------------------------------------------- */
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      type, // "project" | "blog"
      title,
      content,
      tags,
      cover_image_url,
      images,
      short_description,
      project_link,
      github_link,
    } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: "type and title are required" });
    }

    // ✅ CREATE POST (PENDING)
    const { data, error } = await supabaseAdmin
      .from("posts")
      .insert({
        user_id: userId,
        type,
        title,
        content,
        tags,
        cover_image_url,
        images,
        short_description,
        project_link,
        github_link,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Create post error:", error);
      return res.status(500).json({ error: "Failed to create post" });
    }

    /* -------------------------------------------------
       🔔 ADMIN NOTIFICATION (NEW POST)
       Text shown to admin
    ------------------------------------------------- */
    await supabaseAdmin.from("notifications").insert({
      user_id: null, // admin-side notification
      type: "admin_moderation",
      message: "New post submitted for moderation",
      related_post: data.id,
      sender_id: userId,
    });

    return res.status(201).json(data);
  } catch (err) {
    console.error("Unexpected create post error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   LIST POSTS (PUBLIC → APPROVED ONLY)
----------------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const { type } = req.query;

    let query = supabaseAdmin
      .from("posts")
      .select("*, profiles(full_name, avatar_url)")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (type) query = query.eq("type", type);

    const { data, error } = await query;

    if (error) {
      console.error("Fetch posts error:", error);
      return res.status(500).json({ error: "Failed to fetch posts" });
    }

    return res.json(data);
  } catch (err) {
    console.error("Unexpected fetch posts error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   GET MY POSTS (AUTH → ALL STATUSES)
----------------------------------------------------- */
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    let query = supabaseAdmin
      .from("posts")
      .select("*, profiles(full_name, avatar_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (type) query = query.eq("type", type);

    const { data, error } = await query;

    if (error) {
      console.error("Fetch my posts error:", error);
      return res.status(500).json({ error: "Failed to fetch posts" });
    }

    return res.json(data);
  } catch (err) {
    console.error("Unexpected my posts error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   GET SINGLE POST (PUBLIC → APPROVED ONLY)
----------------------------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const postId = req.params.id;

    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*, profiles(full_name, avatar_url)")
      .eq("id", postId)
      .eq("status", "approved")
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.json(data);
  } catch (err) {
    console.error("Unexpected fetch single post error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   DELETE POST (OWNER ONLY)
----------------------------------------------------- */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    const { data: post, error } = await supabaseAdmin
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (error || !post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ error: "You cannot delete this post" });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return res.status(500).json({ error: "Failed to delete post" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Unexpected delete error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   UPVOTE / TOGGLE UPVOTE (AUTH)
----------------------------------------------------- */
router.post("/:id/upvote", requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const { data: existing } = await supabaseAdmin
      .from("post_upvotes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("post_upvotes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      await supabaseAdmin.rpc("update_post_likes_count", { pid: postId });
      return res.json({ upvoted: false });
    }

    await supabaseAdmin.from("post_upvotes").insert({
      post_id: postId,
      user_id: userId,
    });

    await supabaseAdmin.rpc("update_post_likes_count", { pid: postId });
    return res.json({ upvoted: true });
  } catch (err) {
    console.error("Unexpected upvote error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   TOP PROJECTS (PUBLIC → APPROVED ONLY)
----------------------------------------------------- */
router.get("/top/projects", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "8", 10);

    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*, profiles(full_name, avatar_url)")
      .eq("type", "project")
      .eq("status", "approved")
      .order("likes_count", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Top projects error:", error);
      return res.status(500).json({ error: "Failed to fetch top projects" });
    }

    return res.json(data);
  } catch (err) {
    console.error("Unexpected top posts error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
