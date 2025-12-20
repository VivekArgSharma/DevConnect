import { useTheme } from "next-themes";
import { Sun, Moon, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const themes = [
    { id: "light", icon: Sun, label: "Light" },
    { id: "dark", icon: Moon, label: "Dark" },
    { id: "rose", icon: Sparkles, label: "Rose" },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/80 backdrop-blur-sm border border-border">
      {themes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          className={`
            relative p-2 rounded-full transition-all duration-200
            ${theme === id 
              ? "bg-primary text-primary-foreground shadow-md" 
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }
          `}
          aria-label={`Switch to ${label} mode`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
