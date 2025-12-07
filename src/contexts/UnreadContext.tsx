import { createContext, useContext, useState } from "react";

interface UnreadContextType {
  unreadCount: number;
  increment: () => void;
  reset: () => void;
}

const UnreadContext = createContext<UnreadContextType | null>(null);

export const UnreadProvider = ({ children }: { children: React.ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const increment = () => setUnreadCount((prev) => prev + 1);
  const reset = () => setUnreadCount(0);

  return (
    <UnreadContext.Provider value={{ unreadCount, increment, reset }}>
      {children}
    </UnreadContext.Provider>
  );
};

export const useUnread = () => {
  const ctx = useContext(UnreadContext);
  if (!ctx) throw new Error("useUnread must be inside UnreadProvider");
  return ctx;
};
