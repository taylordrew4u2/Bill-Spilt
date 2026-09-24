"use client";

import * as React from "react";
import Link from "next/link";

const KEY = "bb-cookie-consent";

/**
 * Lightweight cookie/ads consent notice (AdSense privacy-disclosure
 * requirement). Shows once until acknowledged. For fully personalized ads to
 * EEA/UK users, Google additionally requires a certified CMP — this notice
 * covers the baseline disclosure + consent for everyone else.
 */
export function CookieConsent() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage unavailable */
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    // A compact floating card rather than a full-width slab: it covers as
    // little of the screen as possible, and inside the app it sits above the
    // tab bar (see globals.css) so navigation stays reachable.
    <div
      data-cookie-consent
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-2xl border bg-card p-3 pl-4 shadow-xl">
        <p className="min-w-0 flex-1 text-sm">
          We use cookies, including Google ads, to keep BillSpilt free.{" "}
          <Link href="/privacy" className="font-semibold text-primary underline-offset-2 hover:underline">
            Privacy
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          className="h-11 flex-shrink-0 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground active:scale-95"
        >
          OK
        </button>
      </div>
    </div>
  );
}
