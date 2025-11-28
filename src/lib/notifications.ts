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
 * Get all notifications (recent)
 */
export async function getAllNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
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
 * Returns an unsubscribe function to call when cleaning up.
 *
 * NOTE: Supabase JS v2 channel API used: supabase.channel(...).on(...).subscribe();
 */
export function subscribeToNotifications(userId: string, onInsert: (row: any) => void) {
  // build channel name unique per user
  const channel = supabase
    .channel(`public:notifications:user_id=eq.${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => {
        // payload.new contains the inserted row
        onInsert(payload.new);
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (e) {
      // ignore removal errors
    }
  };
}
