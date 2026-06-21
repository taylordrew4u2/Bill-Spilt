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
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t bg-card/95 backdrop-blur safe-bottom">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted-foreground">
          We use cookies — including from Google for ads — to keep BILL SPILT
          free. By using the app you agree to this.{" "}
          <Link href="/privacy" className="font-medium text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <button
          onClick={accept}
          className="h-10 flex-shrink-0 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground active:scale-95"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
