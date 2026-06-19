"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "bb-install-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Encourages installing the PWA. On Chromium it captures `beforeinstallprompt`
 * and shows a native install button; on iOS Safari (which has no such event)
 * it shows the manual "Share → Add to Home Screen" hint. Dismissible, and
 * never shown when already installed.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [show, setShow] = React.useState(false);
  const [iosHint, setIosHint] = React.useState(false);

  React.useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS gives no event — show the manual hint after a short delay.
    let t: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) {
      t = setTimeout(() => {
        setIosHint(true);
        setShow(true);
      }, 2500);
    }

    const onInstalled = () => setShow(false);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (t) clearTimeout(t);
    };
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 34 }}
          className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-4 md:bottom-6"
        >
          <div className="mx-auto flex max-w-lg items-center gap-3 rounded-xl border bg-card p-3.5 shadow-lg">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-extrabold text-primary-foreground">
              B
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Install Bill Spilt</p>
              {iosHint ? (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  Tap <Share className="inline h-3 w-3" /> then “Add to Home Screen”
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Full-screen, works offline, one tap from your home screen.
                </p>
              )}
            </div>
            {!iosHint && (
              <Button size="sm" onClick={install}>
                <Download className="h-4 w-4" />
                Install
              </Button>
            )}
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
