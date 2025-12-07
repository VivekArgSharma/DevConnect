import React, { useState, useRef, useEffect } from "react";
import { motion, useSpring, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { supabase } from "@/lib/supabaseClient";

interface NavItem {
  label: string;
  id: string;
  path: string;
}

export const PillBase: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState("home");
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navItems: NavItem[] = [
    { label: "Home", id: "home", path: "/" },
    { label: "Projects", id: "projects", path: "/projects" },
    { label: "Blogs", id: "blogs", path: "/blogs" },
    { label: "Post", id: "post", path: "/post" },
    { label: "Profile", id: "profile", path: "/profile" },
    { label: "Chats", id: "chats", path: "/chats" },
  ];

  const pillWidth = useSpring(140, { stiffness: 220, damping: 25 });
  const pillShift = useSpring(0, { stiffness: 220, damping: 25 });

  useEffect(() => {
    const match = navItems.find((n) => n.path === location.pathname);
    if (match) setActiveSection(match.id);
  }, [location.pathname]);

  useEffect(() => {
    if (hovering) {
      setExpanded(true);
      pillWidth.set(640);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setExpanded(false);
        pillWidth.set(140);
      }, 450);
    }
  }, [hovering]);

  // ✅ ✅ ✅ THIS IS THE KEY FIX
  useEffect(() => {
    async function loadUnread() {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) return;

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_CHAT_SERVER_URL}/chats`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );

        const total = (res.data.chats || []).reduce(
          (sum: number, c: any) => sum + (c.unread_count || 0),
          0
        );

        setUnreadTotal(total);
      } catch (err) {
        console.error("Failed to load unread count:", err);
      }
    }

    // ✅ initial load
    loadUnread();

    // ✅ live update when a chat is opened
    window.addEventListener("chat-read", loadUnread);

    return () => {
      window.removeEventListener("chat-read", loadUnread);
    };
  }, []);

  const handleClick = (item: NavItem) => {
    navigate(item.path);
    setActiveSection(item.id);
  };

  const activeItem = navItems.find((n) => n.id === activeSection);

  return (
    <motion.nav
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      ref={containerRef}
      className="relative rounded-full"
      style={{
        width: pillWidth,
        height: "56px",
        background: "linear-gradient(135deg,#fcfcfd,#e2e3e6)",
        boxShadow: expanded
          ? "0 6px 16px rgba(0,0,0,0.18)"
          : "0 4px 10px rgba(0,0,0,0.12)",
        x: pillShift,
        overflow: "hidden",
      }}
    >
      {!expanded && activeItem && (
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={activeItem.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="font-bold text-gray-900 relative"
            >
              {activeItem.label}
              {activeItem.id === "chats" && unreadTotal > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-0.5">
                  {unreadTotal}
                </span>
              )}
            </motion.span>
          </AnimatePresence>
        </div>
      )}

      {expanded && (
        <div className="flex items-center justify-evenly w-full h-full px-6">
          {navItems.map((item, index) => {
            const isActive = item.id === activeSection;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleClick(item)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative bg-transparent border-none"
                style={{
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#000" : "#777",
                }}
              >
                {item.label}
                {item.id === "chats" && unreadTotal > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-0.5">
                    {unreadTotal}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.nav>
  );
};
