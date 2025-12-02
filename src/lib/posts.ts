// src/lib/posts.ts
import { supabase } from "./supabaseClient";

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

/**
 * Fetch posts by type and tags.
 */
export async function fetchPostsByTags(
  p_type: "project" | "blog",
  selectedTags?: string[]
) {
  let query = supabase
    .from("posts")
    .select("*, profiles(full_name)")
    .eq("type", p_type)
    .order("created_at", { ascending: false });

  if (selectedTags && selectedTags.length > 0) {
    query = query.contains("tags", selectedTags);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Create or update a post
 */
export async function upsertPost(payload: any) {
  if (payload.id) {
    const { data, error } = await supabase
      .from("posts")
      .update(payload)
      .eq("id", payload.id)
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("posts")
      .insert(payload)
      .single();

    if (error) throw error;
    return data;
  }
}
