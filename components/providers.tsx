"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/toaster";
import { syncPending } from "@/lib/sync";

/**
 * Global client providers: NextAuth session, toasts, and a background sync
 * trigger that flushes queued offline expenses whenever the app comes online.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Re-apply what the <head> scripts put on <html> — the desktop-mode phone
  // fix and the dark theme — once React owns the page, before paint: a
  // client re-render of <html> (e.g. recovering from a hydration error) drops
  // those attributes.
  React.useLayoutEffect(() => {
    (window as Window & { __bbViewportFix?: () => void }).__bbViewportFix?.();
    try {
      const t = localStorage.getItem("theme");
      const dark =
        t === "dark" ||
        (!t && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    } catch {
      /* storage unavailable */
    }
  }, []);

  React.useEffect(() => {
    const onOnline = () => {
      void syncPending();
    };
    // Attempt a sync on mount (covers the "was offline, reloaded" case).
    if (typeof navigator !== "undefined" && navigator.onLine) {
      void syncPending();
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
