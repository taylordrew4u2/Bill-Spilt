"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Light/dark theme toggle. The initial class is set by a blocking script in
 * the root layout (no flash); this just flips it and persists the choice.
 */
export function ThemeToggle() {
  const [dark, setDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage may be unavailable */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
    >
      {/* Render a stable icon until mounted to avoid hydration mismatch. */}
      {mounted && dark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
