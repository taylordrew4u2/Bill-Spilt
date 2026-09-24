"use client";

import * as React from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "bb-zoom-hint-dismissed";

type Hint = {
  /** Layout width ÷ physical screen width: how far the browser shrank the page. */
  ratio: number;
  kind: "desktop" | "zoom";
  ios: boolean;
};

/**
 * Works out whether a phone is showing the page shrunk down — "Desktop site"
 * mode (Chrome, Samsung Internet, Safari's "Request Desktop Website") or a
 * page zoom below 100%. Desktop mode ignores the viewport meta tag and lays
 * the page out 980px wide, so everything renders at ~40% and reads as tiny
 * and cramped no matter how the CSS is sized. Only detectable by comparing
 * the layout width with the screen's own width on a touch device.
 */
function detect(): Hint | null {
  if (!window.matchMedia("(pointer: coarse)").matches) return null;
  const landscape = window.matchMedia("(orientation: landscape)").matches;
  // iOS reports screen size in portrait regardless of rotation, Android in
  // the current orientation; normalise to the current one.
  const deviceWidth = landscape
    ? Math.max(screen.width, screen.height)
    : Math.min(screen.width, screen.height);
  // Phones only: tablets are allowed a desktop layout.
  if (!deviceWidth || deviceWidth >= 768) return null;
  const ratio = window.innerWidth / deviceWidth;
  if (ratio < 1.15) return null;
  const ua = navigator.userAgent;
  const ios =
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return { ratio, kind: ratio >= 1.8 ? "desktop" : "zoom", ios };
}

/**
 * A banner, drawn at normal phone size despite the shrunken page, that says
 * which browser switch to flip. It can't fix the setting itself — no page can
 * turn off desktop mode — so it says exactly where the switch is.
 */
export function ZoomHint() {
  const [hint, setHint] = React.useState<Hint | null>(null);

  React.useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* storage unavailable */
    }
    const check = () => setHint(detect());
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!hint) return null;

  function dismiss() {
    setHint(null);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  // Everything below is sized in "phone pixels": multiplied by the shrink
  // ratio so it lands at a normal reading size on the physical screen.
  const px = (n: number) => `${Math.round(n * hint.ratio)}px`;
  const how =
    hint.kind === "desktop" ? (
      hint.ios ? (
        <>
          Tap <strong>aA</strong> in the address bar, then{" "}
          <strong>Request Mobile Website</strong>.
        </>
      ) : (
        <>
          Open your browser&apos;s menu (<strong>⋮</strong>) and turn off{" "}
          <strong>Desktop site</strong>.
        </>
      )
    ) : hint.ios ? (
      <>
        Tap <strong>aA</strong> in the address bar and set the zoom back to{" "}
        <strong>100%</strong>.
      </>
    ) : (
      <>
        Open your browser&apos;s menu and set the page <strong>Zoom</strong>{" "}
        back to <strong>100%</strong>.
      </>
    );

  return (
    <div
      role="region"
      aria-label="Display tip"
      className="fixed inset-x-0 top-0 z-[100] border-b bg-card text-card-foreground shadow-lg"
      style={{ padding: `${px(12)} ${px(16)}` }}
    >
      <div className="flex items-start" style={{ gap: px(12) }}>
        <p className="min-w-0 flex-1" style={{ fontSize: px(17), lineHeight: 1.45 }}>
          <strong className="block" style={{ fontSize: px(19) }}>
            {hint.kind === "desktop"
              ? "This page is in desktop mode"
              : "This page is zoomed out"}
          </strong>
          That&apos;s why everything looks tiny. {how}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
          style={{ width: px(44), height: px(44) }}
        >
          <X aria-hidden style={{ width: px(22), height: px(22) }} />
        </button>
      </div>
    </div>
  );
}
