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

type NotificationsContextType = {
  queue: NotificationRow[];
  pushNotification: (n: NotificationRow) => void;
  clearQueue: () => void;
};

const NotificationsContext = createContext<NotificationsContextType>({
  queue: [],
  pushNotification: () => {},
  clearQueue: () => {},
});

export const useNotificationsContext = () =>
  useContext(NotificationsContext);

export const NotificationsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [queue, setQueue] = useState<NotificationRow[]>([]);

  function pushNotification(n: NotificationRow) {
    setQueue((q) => [n, ...q]);
  }

  function clearQueue() {
    setQueue([]); // ⭐ Clears realtime notifications instantly
  }

  return (
    <NotificationsContext.Provider
      value={{
        queue,
        pushNotification,
        clearQueue, // ⭐ Make function available to NotificationPanel
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};
