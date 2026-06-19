"use client";

import * as React from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Publisher id like "ca-pub-1234567890123456" (set in Vercel env). */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const DEFAULT_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

/**
 * A single Google AdSense responsive display unit. Renders nothing unless a
 * publisher id is configured. Google fills the slot once your site/account is
 * approved; until then (and on localhost/preview) it stays blank.
 */
export function AdSenseUnit({
  slot,
  className,
}: {
  slot?: string;
  className?: string;
}) {
  const pushed = React.useRef(false);
  const adSlot = slot ?? DEFAULT_SLOT;

  React.useEffect(() => {
    if (!ADSENSE_CLIENT || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* script not ready / blocked */
    }
  }, []);

  if (!ADSENSE_CLIENT) return null;

  return (
    <ins
      className={`adsbygoogle block ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={adSlot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
