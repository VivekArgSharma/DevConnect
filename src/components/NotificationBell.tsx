// src/components/NotificationBell.tsx
import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUnreadNotifications,
  subscribeToNotifications,
  markNotificationsRead
} from "@/lib/notifications";
import { useNotificationsContext } from "@/contexts/NotificationsContext";
import NotificationPanel from "@/components/NotificationPanel";

export default function NotificationBell() {
  const { user } = useAuth() as any;
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  const { pushNotification, clearQueue } = useNotificationsContext();

  // Load unread notifications initially + subscribe to realtime new ones
  useEffect(() => {
    if (!user) return;

    (async () => {
      const { data } = await getUnreadNotifications(user.id);
      setCount(data?.length ?? 0);
    })();

    const unsub = subscribeToNotifications(user.id, (row) => {
      pushNotification(row);
      setCount((c) => c + 1);
    });

    return () => unsub();
  }, [user]);

  // ⭐ When panel opens → clear unread count, mark read, and clear UI
  useEffect(() => {
    if (open && user) {
      setCount(0);
      clearQueue();
      markNotificationsRead(user.id);
    }
  }, [open, user, clearQueue]);

  return (
    <>
      {/* Bell icon button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-full hover:bg-slate-100"
      >
        <Bell size={20} />

        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">
            {count}
          </span>
        )}
      </button>

      {/* BACKDROP */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-transparent z-[90]"
        />
      )}

      {/* PANEL */}
      {open && (
        <div className="fixed right-6 top-[150px] w-80 z-[999]">
          <NotificationPanel onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
