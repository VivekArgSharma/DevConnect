// src/lib/notifications.ts
import { supabase } from "@/lib/supabaseClient";

/**
 * Get unread notifications for a user (most recent first)
 */
export async function getUnreadNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Get ONLY unread notifications (for the Panel)
 * We no longer return old read notifications,
 * so they do NOT reappear after clearing.
 */
export async function getAllNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("is_read", false)        // ⭐ FIX: only unread
    .order("created_at", { ascending: false })
    .limit(limit);

  return { data, error };
}

/**
 * Mark unread notifications as read
 */
export async function markNotificationsRead(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return { data, error };
}

/**
 * Subscribe to notifications insert events for the logged-in user.
 */
export function subscribeToNotifications(
  userId: string,
  onInsert: (row: any) => void
) {
  const channel = supabase
    .channel(`public:notifications:user_id=eq.${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onInsert(payload.new); // new unread notification
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (e) {}
  };
}
