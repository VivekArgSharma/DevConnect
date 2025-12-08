// src/routes/teamRoutes.js

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
   CREATE TEAM POST  (Ask for teammates)
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
   GET /api/teams/posts
----------------------------------------------------- */
router.get("/posts", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("team_posts")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch team posts error:", error);
      return res.status(500).json({ error: "Failed to fetch team posts" });
    }

    return res.json(data || []);
  } catch (err) {
    console.error("Unexpected fetch team posts error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   GET SINGLE TEAM POST
   GET /api/teams/posts/:id
----------------------------------------------------- */
router.get("/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await getTeamPostById(postId);

    if (!post) {
      return res.status(404).json({ error: "Team post not found" });
    }

    return res.json(post);
  } catch (err) {
    console.error("Fetch single team post error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   CLOSE APPLICATIONS FOR A POST
   POST /api/teams/posts/:id/close
   Only owner can do this
----------------------------------------------------- */
router.post("/posts/:id/close", requireAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await getTeamPostById(postId);
    if (!post) {
      return res.status(404).json({ error: "Team post not found" });
    }

    if (post.user_id !== userId) {
      return res.status(403).json({ error: "Not allowed to close this post" });
    }

    if (post.status === "closed") {
      return res.json(post); // already closed
    }

    const { data, error } = await supabaseAdmin
      .from("team_posts")
      .update({ status: "closed" })
      .eq("id", postId)
      .select("*")
      .single();

    if (error) {
      console.error("Close team post error:", error);
      return res.status(500).json({ error: "Failed to close team post" });
    }

    return res.json(data);
  } catch (err) {
    console.error("Unexpected close team post error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   APPLY TO A TEAM POST
   POST /api/teams/posts/:id/apply
----------------------------------------------------- */
router.post("/posts/:id/apply", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.id;
    const { name, skills, projects, motivation } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const post = await getTeamPostById(postId);
    if (!post || post.status !== "open") {
      return res.status(400).json({ error: "Applications are closed for this post" });
    }

    const safeSkills = Array.isArray(skills)
      ? skills.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const safeProjects = Array.isArray(projects)
      ? projects.map((p) => ({
          link: String(p.link || "").trim(),
          description: String(p.description || "").trim(),
        }))
      : [];

    const { data, error } = await supabaseAdmin
      .from("team_applications")
      .insert({
        team_post_id: postId,
        applicant_id: userId,
        name,
        skills: safeSkills,
        projects: safeProjects,
        motivation: motivation || null,
        status: "pending",
      })
      .select("*")
      .single();

    if (error) {
      console.error("Create team application error:", error);
      return res.status(500).json({ error: "Failed to create application" });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error("Unexpected apply error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   GET APPLICATIONS FOR YOUR TEAM POSTS
   GET /api/teams/applications/received
----------------------------------------------------- */
router.get("/applications/received", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from("team_applications")
      .select(
        `
        id,
        team_post_id,
        applicant_id,
        name,
        skills,
        projects,
        motivation,
        status,
        created_at,
        team_posts (
          id,
          title,
          status
        )
      `
      )
      .eq("team_posts.user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch received applications error:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch applications for your team" });
    }

    return res.json(data || []);
  } catch (err) {
    console.error("Unexpected fetch received applications error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   GET APPLICATIONS YOU HAVE SENT
   GET /api/teams/applications/sent
----------------------------------------------------- */
router.get("/applications/sent", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from("team_applications")
      .select(
        `
        id,
        team_post_id,
        applicant_id,
        name,
        skills,
        projects,
        motivation,
        status,
        created_at,
        team_posts (
          id,
          title,
          status
        )
      `
      )
      .eq("applicant_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch sent applications error:", error);
      return res.status(500).json({ error: "Failed to fetch your applications" });
    }

    return res.json(data || []);
  } catch (err) {
    console.error("Unexpected fetch sent applications error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   GET SINGLE APPLICATION DETAIL
   GET /api/teams/applications/:id
   (Used when clicking a card to see full details)
----------------------------------------------------- */
router.get("/applications/:id", requireAuth, async (req, res) => {
  try {
    const appId = req.params.id;
    const userId = req.user.id;

    const { data, error } = await supabaseAdmin
      .from("team_applications")
      .select(
        `
        id,
        team_post_id,
        applicant_id,
        name,
        skills,
        projects,
        motivation,
        status,
        created_at,
        team_posts (
          id,
          title,
          status,
          user_id
        )
      `
      )
      .eq("id", appId)
      .maybeSingle();

    if (error) {
      console.error("Fetch application detail error:", error);
      return res.status(500).json({ error: "Failed to fetch application" });
    }
    if (!data) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Only applicant or team owner can see
    if (data.applicant_id !== userId && data.team_posts.user_id !== userId) {
      return res.status(403).json({ error: "Not allowed to view this application" });
    }

    return res.json(data);
  } catch (err) {
    console.error("Unexpected fetch application detail error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/* -----------------------------------------------------
   EDIT YOUR APPLICATION (while post is open)
   PUT /api/teams/applications/:id
----------------------------------------------------- */
router.put("/applications/:id", requireAuth, async (req, res) => {
  try {
    const appId = req.params.id;
    const userId = req.user.id;
    const { name, skills, projects, motivation } = req.body;

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("team_applications")
      .select(
        `
        *,
        team_posts (
          id,
          status
        )
      `
      )
      .eq("id", appId)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch application for edit error:", fetchError);
      return res.status(500).json({ error: "Failed to fetch application" });
    }
    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }

    if (existing.applicant_id !== userId) {
      return res.status(403).json({ error: "Not allowed to edit this application" });
    }

    if (!existing.team_posts || existing.team_posts.status !== "open") {
      return res
        .status(400)
        .json({ error: "Cannot edit application. Applications are closed." });
    }

    const safeSkills = Array.isArray(skills)
      ? skills.map((s) => String(s).trim()).filter(Boolean)
      : existing.skills;

    const safeProjects = Array.isArray(projects)
      ? projects.map((p) => ({
          link: String(p.link || "").trim(),
          description: String(p.description || "").trim(),
        }))
      : existing.projects;

    const { data, error } = await supabaseAdmin
      .from("team_applications")
      .update({
        name: name ?? existing.name,
        skills: safeSkills,
        projects: safeProjects,
        motivation: motivation ?? existing.motivation,
      })
      .eq("id", appId)
      .select("*")
      .single();

    if (error) {
      console.error("Update application error:", error);
      return res.status(500).json({ error: "Failed to update application" });
    }

    return res.json(data);
  } catch (err) {
    console.error("Unexpected update application error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
