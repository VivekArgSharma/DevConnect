// src/lib/follows.ts
import { supabase } from "@/lib/supabaseClient";

/**
 * Follow a user
 */
export async function followUser(followerId: string, targetUserId: string) {
  const { data, error } = await supabase
    .from("follows")
    .insert([{ follower_id: followerId, following_id: targetUserId }])
    .select();
  return { data, error };
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, targetUserId: string) {
  const { data, error } = await supabase
    .from("follows")
    .delete()
    .match({ follower_id: followerId, following_id: targetUserId });
  return { data, error };
}

/**
 * Check whether followerId is following targetUserId
 */
export async function checkIsFollowing(followerId: string, targetUserId: string) {
  const { data, error } = await supabase
    .from("follows")
    .select("id")
    .match({ follower_id: followerId, following_id: targetUserId })
    .limit(1);

  if (error) return { following: false, error };
  return { following: Array.isArray(data) && data.length > 0 };
}

/**
 * Get list of users that `userId` follows (returning following_id)
 */
export async function getFollowingList(userId: string) {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  return { data, error };
}
