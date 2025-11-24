// src/routes/postRoutes.js

import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { supabaseAdmin } from "../config/supabaseClient.js";

const router = express.Router();

/* -----------------------------------------------------
   CREATE A POST
----------------------------------------------------- */
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      type, // "project" or "blog"
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
      })
      .select()
      .single();

    if (error) {
      console.error("Create post error:", error);
      return res.status(500).json({ error: "Failed to create post" });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error("Unexpected create post error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   LIST POSTS (Public)
----------------------------------------------------- */
router.get("/", async (req, res) => {
  try {
    const { type } = req.query;

    let query = supabaseAdmin
      .from("posts")
      .select("*, profiles(full_name, avatar_url)")
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
   GET MY POSTS (Authenticated)
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
   GET SINGLE POST
----------------------------------------------------- */
router.get("/:id", async (req, res) => {
  try {
    const postId = req.params.id;

    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*, profiles(full_name, avatar_url)")
      .eq("id", postId)
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
   DELETE POST
----------------------------------------------------- */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;

    // Verify owner
    const { data: post, error: ownerError } = await supabaseAdmin
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (ownerError || !post) {
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
   UPVOTE / TOGGLE UPVOTE
----------------------------------------------------- */
router.post("/:id/upvote", requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Check if user already upvoted
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("post_upvotes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) {
      console.error("Check upvote error:", checkError);
      return res.status(500).json({ error: "Error checking upvote status" });
    }

    // If exists → remove upvote (toggle)
    if (existing) {
      await supabaseAdmin
        .from("post_upvotes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);

      // Update likes_count
      await supabaseAdmin.rpc("update_post_likes_count", { pid: postId });

      return res.json({ upvoted: false });
    }

    // Otherwise → add upvote
    const { error: insertError } = await supabaseAdmin
      .from("post_upvotes")
      .insert({
        post_id: postId,
        user_id: userId,
      });

    if (insertError) {
      console.error("Insert upvote error:", insertError);
      return res.status(500).json({ error: "Failed to upvote" });
    }

    // Update likes count
    await supabaseAdmin.rpc("update_post_likes_count", { pid: postId });

    return res.json({ upvoted: true });
  } catch (err) {
    console.error("Unexpected upvote error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   TOP POSTS (Top 8 by likes)
----------------------------------------------------- */
router.get("/top/projects", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "8", 10);

    const { data, error } = await supabaseAdmin
      .from("posts")
      .select("*, profiles(full_name, avatar_url)")
      .eq("type", "project")
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
