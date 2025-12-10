// src/lib/stars.ts
import { supabase } from "@/lib/supabaseClient";

/**
 * Toggle star (bookmark) state for a given post and user.
 * Returns { starred: true } if post is now starred, false if unstarred.
 */
export async function toggleStar(postId: string, userId: string): Promise<{ starred: boolean }> {
  if (!userId) throw new Error("User not authenticated");

  // Check if a star already exists
  const { data: existing, error: checkError } = await supabase
    .from("post_stars")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", postId);

  if (checkError) throw checkError;

  if (existing && existing.length > 0) {
    // Unstar: delete row
    const { error: deleteError } = await supabase
      .from("post_stars")
      .delete()
      .eq("user_id", userId)
      .eq("post_id", postId);

    if (deleteError) throw deleteError;
    return { starred: false };
  } else {
    // Star: insert row
    const { error: insertError } = await supabase
      .from("post_stars")
      .insert([{ user_id: userId, post_id: postId }]);

    if (insertError) throw insertError;
    return { starred: true };
  }
}

/**
 * Get IDs of posts starred by this user.
 */
export async function fetchStarredPostIds(userId: string): Promise<string[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("post_stars")
    .select("post_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data || []).map((row: any) => row.post_id);
}

/**
 * Get full post objects (with profile) for this user's starred posts.
 */
export async function fetchStarredPosts(userId: string): Promise<any[]> {
  if (!userId) return [];

  // First get list of post_ids
  const { data: stars, error: starsError } = await supabase
    .from("post_stars")
    .select("post_id")
    .eq("user_id", userId);

  if (starsError) throw starsError;
  if (!stars || stars.length === 0) return [];

  const postIds = stars.map((s: any) => s.post_id);

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("*, profiles(full_name, avatar_url)")
    .in("id", postIds)
    .order("created_at", { ascending: false });

  if (postsError) throw postsError;
  return posts || [];
}
