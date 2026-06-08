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
