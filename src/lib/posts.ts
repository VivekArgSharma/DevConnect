// src/lib/posts.ts
import { supabase } from "./supabaseClient";

/* -----------------------------------------------------
   TAGS (UNCHANGED)
----------------------------------------------------- */

// Fetch tags by content type (project or blog)
export async function fetchAllTags(type: "project" | "blog") {
  const viewName =
    type === "project"
      ? "project_tags_aggregate"
      : "blog_tags_aggregate";

  const { data, error } = await supabase
    .from(viewName)
    .select("*")
    .order("tag_count", { ascending: false });

  if (error) throw error;
  return data;
}

/* -----------------------------------------------------
   FETCH POSTS (PUBLIC → APPROVED ONLY)
----------------------------------------------------- */

export async function fetchPostsByTags(
  p_type: "project" | "blog",
  selectedTags?: string[]
) {
  let query = supabase
    .from("posts")
    .select("*, profiles(full_name)")
    .eq("type", p_type)
    .eq("status", "approved") // ✅ CRITICAL FIX
    .order("created_at", { ascending: false });

  if (selectedTags && selectedTags.length > 0) {
    query = query.contains("tags", selectedTags);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data ?? [];
}

/* -----------------------------------------------------
   ❌ DISABLED: FRONTEND SHOULD NOT WRITE POSTS
----------------------------------------------------- */

/**
 * ❌ DO NOT USE THIS ANYMORE
 * All post creation / updates must go through backend
 * (/api/posts) so status is enforced.
 */
export async function upsertPost() {
  throw new Error(
    "Direct post creation/update from frontend is disabled. Use backend API."
  );
}
