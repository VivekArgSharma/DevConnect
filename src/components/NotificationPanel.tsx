// src/components/NotificationPanel.tsx
import React, { useEffect, useState } from "react";
import { getAllNotifications, markNotificationsRead } from "@/lib/notifications";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationsContext } from "@/contexts/NotificationsContext";

interface NotificationPanelProps {
  onClose?: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { user } = useAuth() as any;
  const [notifications, setNotifications] = useState<any[]>([]);

  const { queue, clearQueue } = useNotificationsContext(); // ⭐ Add clearQueue

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    (async () => {
      const { data } = await getAllNotifications(user.id, 50);
      if (mounted) setNotifications(data ?? []);
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleMarkAllRead() {
    if (!user) return;

    await markNotificationsRead(user.id);

    // ⭐ INSTANLY CLEAR UI LIST
    setNotifications([]); 
    clearQueue(); // removes realtime ones too

    if (onClose) onClose();
  }

  const merged = [...queue, ...notifications];

  return (
    <div className="bg-white shadow-xl rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="font-medium">Notifications</div>
        <div className="text-sm text-slate-500">{merged.length} total</div>
      </div>

      <div className="max-h-96 overflow-auto">
        {merged.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No notifications yet.</div>
        ) : (
          merged.map((n: any) => (
            <div
              key={n.id}
              className="p-3 border-b hover:bg-slate-50 cursor-pointer"
            >
              <div className="text-sm">{n.message}</div>
              <div className="text-xs text-slate-400">
                {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2 flex justify-end border-t bg-slate-50">
        <button
          onClick={handleMarkAllRead}
          className="text-sm px-3 py-1 rounded-md bg-slate-200 hover:bg-slate-300"
        >
          Mark all read
        </button>
      </div>
    </div>
  );
}
