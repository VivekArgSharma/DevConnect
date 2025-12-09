import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { supabaseAdmin } from "../config/supabaseClient.js";

const router = express.Router();

/* -----------------------------------------------------
   HELPERS
----------------------------------------------------- */

async function getTeamPostById(id) {
  const { data, error } = await supabaseAdmin
    .from("team_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/* -----------------------------------------------------
   CREATE TEAM POST
   POST /api/teams/posts
----------------------------------------------------- */
router.post("/posts", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      image_url,
      current_members,
      requirements,
      hackathon_link,
      github_link,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const { data, error } = await supabaseAdmin
      .from("team_posts")
      .insert({
        user_id: userId,
        title,
        description,
        image_url: image_url || null,
        current_members: current_members ?? null,
        requirements: requirements || null,
        hackathon_link: hackathon_link || null,
        github_link: github_link || null,
        status: "open",
      })
      .select("*")
      .single();

    if (error) {
      console.error("Create team post error:", error);
      return res.status(500).json({ error: "Failed to create team post" });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error("Unexpected create team post error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   GET ALL OPEN TEAM POSTS
----------------------------------------------------- */
router.get("/posts", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("team_posts")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: "Failed to fetch team posts" });
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   GET SINGLE TEAM POST
----------------------------------------------------- */
router.get("/posts/:id", async (req, res) => {
  const post = await getTeamPostById(req.params.id);
  if (!post) return res.status(404).json({ error: "Team post not found" });
  res.json(post);
});

/* -----------------------------------------------------
   CLOSE APPLICATIONS
----------------------------------------------------- */
router.post("/posts/:id/close", requireAuth, async (req, res) => {
  const post = await getTeamPostById(req.params.id);
  if (!post) return res.status(404).json({ error: "Team post not found" });

  if (post.user_id !== req.user.id)
    return res.status(403).json({ error: "Not allowed" });

  const { data, error } = await supabaseAdmin
    .from("team_posts")
    .update({ status: "closed" })
    .eq("id", post.id)
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: "Failed to close post" });
  res.json(data);
});

/* -----------------------------------------------------
   APPLY TO TEAM
----------------------------------------------------- */
router.post("/posts/:id/apply", requireAuth, async (req, res) => {
  const post = await getTeamPostById(req.params.id);
  if (!post || post.status !== "open")
    return res.status(400).json({ error: "Applications closed" });

  const { data, error } = await supabaseAdmin
    .from("team_applications")
    .insert({
      team_post_id: post.id,
      applicant_id: req.user.id,
      name: req.body.name,
      skills: req.body.skills || [],
      projects: req.body.projects || [],
      motivation: req.body.motivation || null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: "Failed to apply" });
  res.status(201).json(data);
});

/* -----------------------------------------------------
   ✅ GET APPLICATIONS FOR YOUR TEAM
----------------------------------------------------- */
router.get("/applications/received", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("team_applications")
    .select(
      `
      *,
      team_posts!inner (id, title, status, user_id)
    `
    )
    .eq("team_posts.user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Failed to fetch received apps" });
  res.json(data || []);
});

/* -----------------------------------------------------
   ✅ GET YOUR SENT APPLICATIONS
----------------------------------------------------- */
router.get("/applications/sent", requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("team_applications")
    .select(
      `
      *,
      team_posts (id, title, status)
    `
    )
    .eq("applicant_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Failed to fetch sent apps" });
  res.json(data || []);
});

/* -----------------------------------------------------
   GET SINGLE APPLICATION
----------------------------------------------------- */
router.get("/applications/:id", requireAuth, async (req, res) => {
  const { data } = await supabaseAdmin
    .from("team_applications")
    .select(`*, team_posts (id, title, status, user_id)`)
    .eq("id", req.params.id)
    .maybeSingle();

  if (!data) return res.status(404).json({ error: "Application not found" });

  if (
    data.applicant_id !== req.user.id &&
    data.team_posts.user_id !== req.user.id
  )
    return res.status(403).json({ error: "Not allowed" });

  res.json(data);
});

/* -----------------------------------------------------
   EDIT APPLICATION (ONLY IF OPEN)
----------------------------------------------------- */
router.put("/applications/:id", requireAuth, async (req, res) => {
  const { data: existing } = await supabaseAdmin
    .from("team_applications")
    .select(`*, team_posts (status)`)
    .eq("id", req.params.id)
    .maybeSingle();

  if (!existing) return res.status(404).json({ error: "Not found" });
  if (existing.applicant_id !== req.user.id)
    return res.status(403).json({ error: "Forbidden" });
  if (existing.team_posts.status !== "open")
    return res.status(400).json({ error: "Applications closed" });

  const { data, error } = await supabaseAdmin
    .from("team_applications")
    .update({
      name: req.body.name,
      skills: req.body.skills,
      projects: req.body.projects,
      motivation: req.body.motivation,
    })
    .eq("id", req.params.id)
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: "Update failed" });
  res.json(data);
});

/* -----------------------------------------------------
   ✅ ✅ ✅ DELETE APPLICATION (FINAL MISSING PIECE)
   - Applicant can delete their own application
   - Team owner can mark as "Review Done"
----------------------------------------------------- */
router.delete("/applications/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const appId = req.params.id;

    const { data: app } = await supabaseAdmin
      .from("team_applications")
      .select(`*, team_posts (user_id)`)
      .eq("id", appId)
      .maybeSingle();

    if (!app) return res.status(404).json({ error: "Application not found" });

    const isApplicant = app.applicant_id === userId;
    const isTeamOwner = app.team_posts.user_id === userId;

    if (!isApplicant && !isTeamOwner)
      return res.status(403).json({ error: "Not authorized to delete" });

    const { error } = await supabaseAdmin
      .from("team_applications")
      .delete()
      .eq("id", appId);

    if (error) return res.status(500).json({ error: "Delete failed" });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete application error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
