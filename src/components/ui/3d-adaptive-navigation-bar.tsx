import React, { useState, useRef, useEffect } from "react";
import { motion, useSpring, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { supabase } from "@/lib/supabaseClient";
import { 
  Home, 
  FolderKanban, 
  FileText, 
  PenSquare, 
  Users, 
  User, 
  MessageCircle,
  Shield
} from "lucide-react";

interface NavItem {
  label: string;
  id: string;
  path: string;
  icon: React.ElementType;
}

export const PillBase: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState("home");
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) return;

      if (user.email === import.meta.env.VITE_ADMIN_EMAIL) {
        setIsAdmin(true);
      }
    }

    checkAdmin();
  }, []);

  const navItems: NavItem[] = [
    { label: "Home", id: "home", path: "/", icon: Home },
    { label: "Projects", id: "projects", path: "/projects", icon: FolderKanban },
    { label: "Blogs", id: "blogs", path: "/blogs", icon: FileText },
    { label: "Post", id: "post", path: "/post", icon: PenSquare },
    { label: "Teams", id: "teams", path: "/teams", icon: Users },
    { label: "Profile", id: "profile", path: "/profile", icon: User },
    { label: "Chats", id: "chats", path: "/chats", icon: MessageCircle },
    ...(isAdmin
      ? [{ label: "Admin", id: "admin", path: "/admin", icon: Shield }]
      : []),
  ];

  const pillWidth = useSpring(56, { stiffness: 220, damping: 25 });

  useEffect(() => {
    const match = navItems.find((n) => n.path === location.pathname);
    if (match) setActiveSection(match.id);
  }, [location.pathname, navItems]);

  useEffect(() => {
    if (hovering) {
      setExpanded(true);
      pillWidth.set(navItems.length * 72 + 48);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setExpanded(false);
        pillWidth.set(56);
      }, 400);
    }
  }, [hovering, navItems.length]);

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

    loadUnread();
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
  const ActiveIcon = activeItem?.icon;

  return (
    <motion.nav
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      ref={containerRef}
      className="relative rounded-full backdrop-blur-xl"
      style={{
        width: pillWidth,
        height: "56px",
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        boxShadow: expanded
          ? "0 8px 32px -8px rgba(0, 0, 0, 0.5), 0 0 0 1px hsl(var(--border))"
          : "0 4px 16px -4px rgba(0, 0, 0, 0.4)",
        overflow: "hidden",
      }}
    >
      {/* Collapsed State - Show Icon */}
      {!expanded && activeItem && ActiveIcon && (
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <ActiveIcon className="w-5 h-5 text-foreground" />
              {activeItem.id === "chats" && unreadTotal > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {unreadTotal}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Expanded State */}
      {expanded && (
        <div className="flex items-center justify-evenly w-full h-full px-4">
          {navItems.map((item, index) => {
            const isActive = item.id === activeSection;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleClick(item)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-medium">{item.label}</span>

                {item.id === "chats" && unreadTotal > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-1">
                    {unreadTotal}
                  </span>
                )}

                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.nav>
  );
};
