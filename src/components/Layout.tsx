// src/components/Layout.tsx
import { ReactNode } from "react";
import { PillBase } from "@/components/ui/3d-adaptive-navigation-bar";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  // Home page should NOT be pushed down
  const isHomePage = location.pathname === "/";

  return (
    <div className="relative min-h-screen">
      {/* FLOATING NAVBAR */}
      <div className="fixed top-6 left-0 right-0 z-[300] flex justify-center pointer-events-auto">
        {/* Navigation Pill */}
        <div className="relative flex items-center gap-4">
          <PillBase />
        </div>

        {/* Right side controls */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
        </div>
      </div>

      {/* PAGE CONTENT */}
      <main className={`relative z-[1] ${isHomePage ? "" : "pt-40"}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
