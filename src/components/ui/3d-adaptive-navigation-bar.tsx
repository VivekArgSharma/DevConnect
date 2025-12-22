import React, { useState, useRef, useEffect } from "react";
import { motion, useSpring, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import {
  Home,
  FolderKanban,
  FileText,
  PenSquare,
  Users,
  User,
  MessageCircle,
  Shield,
} from "lucide-react";

interface NavItem {
  label: string;
  id: string;
  path: string;
  icon: React.ElementType;
}

interface PillBaseProps {
  onExpandedChange?: (expanded: boolean) => void;
}

export const PillBase: React.FC<PillBaseProps> = ({ onExpandedChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeSection, setActiveSection] = useState("home");
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* -------------------- ADMIN CHECK -------------------- */
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

  /* -------------------- MOBILE -------------------- */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const collapsedSize = isMobile ? 48 : 56;
  const itemWidth = isMobile ? 44 : 72;
  const padding = isMobile ? 16 : 48;

  const pillWidth = useSpring(collapsedSize, { stiffness: 220, damping: 25 });
  const pillHeight = useSpring(isMobile ? 48 : 56, {
    stiffness: 220,
    damping: 25,
  });

  /* -------------------- ACTIVE ROUTE -------------------- */
  useEffect(() => {
    const match = navItems.find((n) => n.path === location.pathname);
    if (match) setActiveSection(match.id);
  }, [location.pathname, navItems]);

  /* -------------------- HOVER EXPAND -------------------- */
  useEffect(() => {
    if (hovering) {
      setExpanded(true);
      pillWidth.set(navItems.length * itemWidth + padding);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    } else {
      hoverTimeoutRef.current = setTimeout(() => {
        setExpanded(false);
        pillWidth.set(collapsedSize);
      }, 400);
    }
  }, [hovering, navItems.length, itemWidth, padding, collapsedSize, pillWidth]);

  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  /* ======================================================
     UNREAD COUNT — BACKEND REMOVED (INTENTIONAL)
  ====================================================== */
  useEffect(() => {
    setUnreadTotal(0);
  }, [location.pathname]);

  /* -------------------- NAV HANDLERS -------------------- */
  const handleClick = (item: NavItem) => {
    navigate(item.path);
    setActiveSection(item.id);
  };

  const activeItem = navItems.find((n) => n.id === activeSection);
  const ActiveIcon = activeItem?.icon;

  const handleNavClick = () => {
    if (!expanded) setHovering(true);
  };

  /* -------------------- RENDER -------------------- */
  return (
    <motion.nav
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={handleNavClick}
      ref={containerRef}
      className="relative rounded-full backdrop-blur-xl"
      style={{
        width: pillWidth,
        height: pillHeight,
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        boxShadow: expanded
          ? "0 8px 32px -8px rgba(0, 0, 0, 0.5), 0 0 0 1px hsl(var(--border))"
          : "0 4px 16px -4px rgba(0, 0, 0, 0.4)",
        overflow: "hidden",
      }}
    >
      {/* Collapsed */}
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
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Expanded */}
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
                className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-medium">{item.label}</span>

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
