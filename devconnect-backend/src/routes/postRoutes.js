// src/routes/postRoutes.js
import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { supabaseAdmin } from '../config/supabaseClient.js';

const router = express.Router();

// Create a post
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      type,                 // 'project' or 'blog'
      title,
      content,
      tags,                 // optional array of strings
      cover_image_url,
      images,               // optional array of strings
      short_description,
      project_link,
      github_link,
    } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: 'type and title are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('posts')
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
      console.error('Supabase error creating post:', error);
      return res.status(500).json({ error: 'Failed to create post' });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('Error creating post:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// List posts (public)
router.get('/', async (req, res) => {
  try {
    const { type, featured, limit } = req.query;

    let query = supabaseAdmin
      .from('posts')
      .select('*, profiles!inner(full_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching posts:', error);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }

    return res.json(data);
  } catch (err) {
    console.error('Error fetching posts:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get posts for the logged-in user
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    let query = supabaseAdmin
      .from('posts')
      .select('*, profiles!inner(full_name, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching my posts:', error);
      return res.status(500).json({ error: 'Failed to fetch your posts' });
    }

    return res.json(data);
  } catch (err) {
    console.error('Error fetching my posts:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single post by id (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('*, profiles!inner(full_name, avatar_url)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error fetching post:', error);
      return res.status(500).json({ error: 'Failed to fetch post' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.json(data);
  } catch (err) {
    console.error('Error fetching post:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a post by id (only owner)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error deleting post:', error);
      return res.status(500).json({ error: 'Failed to delete post' });
    }

    if (!data) {
      // Either post doesn't exist or doesn't belong to this user
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting post:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
