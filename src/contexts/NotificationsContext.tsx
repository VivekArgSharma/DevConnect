// src/contexts/NotificationsContext.tsx
import React, { createContext, useContext, useState } from "react";

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  message: string;
  related_post?: string | null;
  is_read?: boolean;
  created_at?: string;
};

const NotificationsContext = createContext({
  queue: [] as NotificationRow[],
  pushNotification: (n: NotificationRow) => {},
});

export const useNotificationsContext = () => useContext(NotificationsContext);

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [queue, setQueue] = useState<NotificationRow[]>([]);

  function pushNotification(n: NotificationRow) {
    setQueue((q) => [n, ...q]);
  }

  return (
    <NotificationsContext.Provider value={{ queue, pushNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
};
