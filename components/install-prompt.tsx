"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, X, Share } from "lucide-react";
import Image from "next/image";
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
          className="fixed inset-x-0 bottom-[calc(theme(spacing.tabbar)+env(safe-area-inset-bottom)+0.75rem)] z-40 px-3 md:bottom-6"
        >
          <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border bg-card p-3 pl-3.5 shadow-xl">
            <Image
              src="/icons/icon-192.png"
              alt=""
              aria-hidden
              width={44}
              height={44}
              className="flex-shrink-0 rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Install BillSpilt</p>
              {iosHint ? (
                <p className="text-sm text-muted-foreground">
                  Tap <Share className="inline h-4 w-4 align-[-3px]" aria-label="Share" /> then “Add to Home Screen”
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Works offline, one tap away.
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
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="-mr-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
