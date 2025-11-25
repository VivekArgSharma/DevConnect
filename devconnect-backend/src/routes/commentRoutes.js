// src/routes/commentRoutes.js
import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { supabaseAdmin } from '../config/supabaseClient.js';

const router = express.Router();

/**
 * GET /api/comments?post_id=<id>
 * Returns all comments (flat array) for a post, with user profile (full_name, avatar_url).
 */
router.get('/', async (req, res) => {
  try {
    const { post_id } = req.query;
    if (!post_id) return res.status(400).json({ error: 'post_id is required' });

    // fetch comments, include profile info
    const { data, error } = await supabaseAdmin
      .from('post_comments')
      .select('id, post_id, parent_id, content, created_at, updated_at, user_id, profiles (full_name, avatar_url)')
      .eq('post_id', post_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fetch comments error:', error);
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }

    return res.json(data);
  } catch (err) {
    console.error('GET /api/comments err:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/comments
 * Body: { post_id, content, parent_id (optional) }
 * Requires auth. Create a comment or reply.
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { post_id, content, parent_id = null } = req.body;

    if (!post_id || !content) return res.status(400).json({ error: 'post_id and content required' });

    const insertPayload = {
      post_id,
      user_id: userId,
      content,
      parent_id
    };

    const { data, error } = await supabaseAdmin
      .from('post_comments')
      .insert(insertPayload)
      .select('id, post_id, parent_id, content, created_at, updated_at, user_id, profiles (full_name, avatar_url)')
      .single();

    if (error) {
      console.error('Create comment error:', error);
      return res.status(500).json({ error: 'Failed to create comment' });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('POST /api/comments err:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/comments/:id
 * Only comment owner (user_id) can delete their comment.
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // check owner
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('post_comments')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchErr) {
      console.error('Fetch comment owner error:', fetchErr);
      return res.status(500).json({ error: 'Failed to fetch comment' });
    }
    if (!existing) return res.status(404).json({ error: 'Comment not found' });

    if (existing.user_id !== userId) {
      return res.status(403).json({ error: 'Not allowed to delete this comment' });
    }

    const { error: delErr } = await supabaseAdmin
      .from('post_comments')
      .delete()
      .eq('id', id);

    if (delErr) {
      console.error('Delete comment error:', delErr);
      return res.status(500).json({ error: 'Failed to delete comment' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/comments/:id err:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
