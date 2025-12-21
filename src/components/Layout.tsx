// src/components/Layout.tsx
import { ReactNode, useState } from "react";
import { PillBase } from "@/components/ui/3d-adaptive-navigation-bar";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [navExpanded, setNavExpanded] = useState(false);

  // Home page should NOT be pushed down
  const isHomePage = location.pathname === "/";

  return (
    <div className="relative min-h-screen">
      {/* FLOATING NAVBAR */}
      <div className="fixed top-6 left-0 right-0 z-[300] flex justify-center pointer-events-auto">
        {/* Navigation Pill */}
        <div className="relative flex items-center gap-4">
          <PillBase onExpandedChange={setNavExpanded} />
        </div>

        {/* Right side controls - hide when navbar is expanded on mobile */}
        <AnimatePresence>
          {!navExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 flex items-center gap-3"
            >
              <ThemeToggle />
              <NotificationBell />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PAGE CONTENT */}
      <main className={`relative z-[1] ${isHomePage ? "" : "pt-40"}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
