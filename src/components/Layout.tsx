import { ReactNode } from "react";
import { PillBase } from "@/components/ui/3d-adaptive-navigation-bar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4">
        <PillBase />
      </header>
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
