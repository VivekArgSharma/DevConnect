// devconnect-backend/src/routes/commentRoutes.js
import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { supabaseAdmin } from '../config/supabaseClient.js';

const router = express.Router();

/* ============================================================
   Fetch comments WITH profiles + proper parent/child structure
   ============================================================ */
router.get('/', async (req, res) => {
  try {
    const post_id = req.query.post_id;
    if (!post_id) return res.status(400).json({ error: "post_id required" });

    const { data, error } = await supabaseAdmin
      .from("post_comments")
      .select(`
        *,
        profiles:profiles (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("post_id", post_id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch comments" });
    }

    const normalized = data.map((c) => {
      if (Array.isArray(c.profiles)) c.profiles = c.profiles[0] || null;
      return c;
    });

    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   Create a comment OR reply
   ============================================================ */
router.post('/', requireAuth, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { post_id, content, parent_id } = req.body;

    if (!post_id || !content) {
      return res.status(400).json({ error: "post_id and content required" });
    }

    const insertPayload = {
      post_id,
      user_id,
      content,
      parent_id: parent_id || null, // IMPORTANT FIX
    };

    const { data, error } = await supabaseAdmin
      .from("post_comments")
      .insert([insertPayload])
      .select();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create comment" });
    }

    const inserted = data[0];

    // Fetch the inserted comment WITH profiles
    const { data: withProfile, error: profErr } = await supabaseAdmin
      .from("post_comments")
      .select(`
        *,
        profiles:profiles (
          id,
          full_name,
          avatar_url
        )
      `)
      .eq("id", inserted.id)
      .single();

    if (Array.isArray(withProfile.profiles)) {
      withProfile.profiles = withProfile.profiles[0] || null;
    }

    res.status(201).json(withProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   Delete comment (must be comment owner)
   ============================================================ */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const user_id = req.user.id;
    const id = req.params.id;

    const { data: existing } = await supabaseAdmin
      .from('post_comments')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) return res.status(404).json({ error: "Comment not found" });

    if (existing.user_id !== user_id) {
      return res.status(403).json({ error: "Not allowed" });
    }

    await supabaseAdmin.from('post_comments').delete().eq('id', id);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
