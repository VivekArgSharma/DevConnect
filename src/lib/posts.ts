// src/lib/posts.ts
import { supabase } from "./supabaseClient";

/** Fetch all tags with counts */
export async function fetchAllTags() {
  const { data, error } = await supabase
    .from("tags_aggregate")
    .select("*")
    .order("tag_count", { ascending: false });

  if (error) throw error;
  return data;
}

/** Fetch posts with tag filtering */
export async function fetchPostsByTags(
  p_type: string | null,
  selectedTags?: string[]
) {
  let query = supabase
    .from("posts")
    .select("*, profiles(full_name)")
    .order("created_at", { ascending: false });

  if (p_type) query = query.eq("type", p_type);

  if (selectedTags && selectedTags.length > 0) {
    query = query.contains("tags", selectedTags);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/** Create or update post */
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
