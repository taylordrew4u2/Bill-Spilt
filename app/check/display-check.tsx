"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Snapshot = Record<string, string | number | boolean | null>;

function snapshot(build: string): Snapshot {
  const vv = window.visualViewport;
  const meta = document.querySelector('meta[name="viewport"]');
  const nav = navigator as Navigator & {
    userAgentData?: { mobile?: boolean; platform?: string };
    standalone?: boolean;
  };
  return {
    build,
    path: location.pathname,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    screenWidth: screen.width,
    screenHeight: screen.height,
    dpr: window.devicePixelRatio,
    vvScale: vv ? Math.round(vv.scale * 1000) / 1000 : null,
    vvWidth: vv ? Math.round(vv.width) : null,
    coarsePointer: matchMedia("(pointer: coarse)").matches,
    hoverNone: matchMedia("(hover: none)").matches,
    landscape: matchMedia("(orientation: landscape)").matches,
    standalone:
      matchMedia("(display-mode: standalone)").matches || nav.standalone === true,
    bodyFontPx: parseFloat(getComputedStyle(document.body).fontSize),
    phoneFix: document.documentElement.classList.contains("bb-phone-fix"),
    htmlFontPx: parseFloat(getComputedStyle(document.documentElement).fontSize),
    viewportMeta: meta?.getAttribute("content") ?? null,
    swControlled: !!navigator.serviceWorker?.controller,
    uaMobile: nav.userAgentData?.mobile ?? null,
    uaPlatform: nav.userAgentData?.platform ?? null,
    ua: navigator.userAgent,
  };
}

/**
 * A plain readout of the numbers that decide whether the phone layout is
 * used, sent once to the server log so it can be read remotely.
 */
export function DisplayCheck({ build }: { build: string }) {
  const [snap, setSnap] = React.useState<Snapshot | null>(null);
  const [sent, setSent] = React.useState<"idle" | "sending" | "sent" | "failed">("idle");

  const send = React.useCallback(async (s: Snapshot) => {
    setSent("sending");
    try {
      const res = await fetch("/api/client-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      setSent(res.ok ? "sent" : "failed");
    } catch {
      setSent("failed");
    }
  }, []);

  React.useEffect(() => {
    // Give the browser a moment to settle its initial zoom first.
    const t = setTimeout(() => {
      const s = snapshot(build);
      setSnap(s);
      void send(s);
    }, 1200);
    return () => clearTimeout(t);
  }, [build, send]);

  // Same measure the fix uses (lib/viewport-fix.ts): layout width from
  // clientWidth, which pinch-zoom doesn't change.
  const shrunk =
    snap &&
    typeof snap.clientWidth === "number" &&
    typeof snap.screenWidth === "number" &&
    snap.clientWidth > snap.screenWidth * 1.15;

  return (
    <main className="mx-auto min-h-[100dvh] max-w-lg px-gutter py-8 safe-top safe-bottom">
      <h1 className="text-3xl font-bold tracking-tight">Display check</h1>
      <p className="mt-2 text-base text-muted-foreground">
        This sends how your phone is showing BillSpilt so the layout can be
        fixed for it. Nothing personal is included.
      </p>

      <div className="mt-6 rounded-2xl border bg-card p-4">
        {!snap ? (
          <p className="flex items-center gap-2 text-base">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Checking…
          </p>
        ) : (
          <>
            <p className="text-lg font-semibold">
              {snap.phoneFix
                ? "Your browser is in desktop mode — BillSpilt switched it back to the phone layout."
                : shrunk
                  ? "Your phone is showing the wide desktop layout."
                  : "Your phone is showing the phone layout."}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Page width</dt>
              <dd className="tabular-nums">{String(snap.clientWidth)}</dd>
              <dt className="text-muted-foreground">Screen width</dt>
              <dd className="tabular-nums">{String(snap.screenWidth)}</dd>
              <dt className="text-muted-foreground">Zoom</dt>
              <dd className="tabular-nums">{String(snap.vvScale)}</dd>
              <dt className="text-muted-foreground">Auto-fix on</dt>
              <dd>{snap.phoneFix ? "Yes" : "No"}</dd>
              <dt className="text-muted-foreground">Installed app</dt>
              <dd>{snap.standalone ? "Yes" : "No"}</dd>
              <dt className="text-muted-foreground">Version</dt>
              <dd className="tabular-nums">{String(snap.build)}</dd>
            </dl>
          </>
        )}
      </div>

      <p className="mt-4 flex items-center gap-2 text-base font-medium">
        {sent === "sent" && (
          <>
            <CheckCircle2 className="h-5 w-5 text-positive" aria-hidden /> Sent — thanks!
          </>
        )}
        {sent === "sending" && "Sending…"}
        {sent === "failed" && (
          <Button type="button" variant="outline" onClick={() => snap && send(snap)}>
            Couldn&apos;t send — try again
          </Button>
        )}
      </p>

      <Button asChild size="lg" className="mt-6 w-full">
        <Link href="/home">Back to BillSpilt</Link>
      </Button>
    </main>
  );
}
