// src/components/NotificationPanel.tsx
import React, { useEffect, useState } from "react";
import { getAllNotifications, markNotificationsRead } from "@/lib/notifications";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationsContext } from "@/contexts/NotificationsContext";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationPanelProps {
  onClose?: () => void;
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const { user } = useAuth() as any;
  const [notifications, setNotifications] = useState<any[]>([]);

  const { queue, clearQueue } = useNotificationsContext();

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

    setNotifications([]);
    clearQueue();

    if (onClose) onClose();
  }

  const merged = [...queue, ...notifications];

  return (
    <div className="bg-card border border-border rounded-xl shadow-surface-lg overflow-hidden w-80 animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">Notifications</span>
        </div>
        <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">
          {merged.length}
        </span>
      </div>

      {/* Notification List */}
      <div className="max-h-80 overflow-auto">
        {merged.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          merged.map((n: any) => (
            <div
              key={n.id}
              className="p-4 border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <p className="text-sm text-foreground leading-relaxed">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {merged.length > 0 && (
        <div className="p-3 border-t border-border bg-secondary/30">
          <Button
            onClick={handleMarkAllRead}
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </Button>
        </div>
      )}
    </div>
  );
}
