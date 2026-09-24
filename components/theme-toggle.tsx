"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
];

function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

/**
 * Light / dark / follow-the-device theme picker. The initial class is set by a
 * blocking script in the root layout (no flash); this flips it and persists
 * the choice. "Auto" clears the stored choice so the layout script falls back
 * to the OS setting on the next load.
 */
export function ThemeSelect({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<Theme>("system");

  React.useEffect(() => {
    try {
      const t = localStorage.getItem("theme");
      setTheme(t === "dark" || t === "light" ? t : "system");
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  // While on "Auto", follow the OS if it flips (e.g. sunset dark mode).
  React.useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  function choose(next: Theme) {
    setTheme(next);
    apply(next);
    try {
      if (next === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {
      /* storage may be unavailable */
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className={cn("grid grid-cols-3 gap-1 rounded-xl bg-muted p-1", className)}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(value)}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
