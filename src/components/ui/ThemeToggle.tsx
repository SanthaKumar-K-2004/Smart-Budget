"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

const options = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Standard next-themes hydration guard: theme is only known client-side,
    // so we defer rendering the active state until after mount to avoid a
    // server/client mismatch. Intentionally a one-time setState-on-mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (compact) {
    if (!mounted) return <div className="w-9 h-9" />;
    const isDark = resolvedTheme === "dark";
    return (
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle theme"
        className="icon-btn"
      >
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    );
  }

  if (!mounted) return <div className="w-[102px] h-9" />;

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-full glass">
      {options.map((o) => {
        const Icon = o.icon;
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            onClick={() => setTheme(o.value)}
            aria-label={o.label}
            title={o.label}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              active ? "bg-[var(--brand)] text-white" : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
