// src/components/Layout.tsx
import { ReactNode } from "react";
import { PillBase } from "@/components/ui/3d-adaptive-navigation-bar";
import NotificationBell from "@/components/NotificationBell";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="relative min-h-screen">

      {/* FLOATING NAVBAR — stays above EVERYTHING */}
      <div className="fixed top-6 left-0 right-0 z-[300] flex justify-center pointer-events-auto">
        <PillBase />
      </div>

      {/* FLOATING NOTIFICATION BELL — above page & behind nothing */}
      <div className="fixed right-8 top-[130px] z-[300] pointer-events-auto">
        <NotificationBell />
      </div>

      {/* PAGE CONTENT GOES BEHIND NAVBAR (z-index BELOW 0) */}
      <main className="relative z-[1] pt-56">
        {/* Push content downward visually but let navbar float above */}
        <div className="relative z-[-1]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
