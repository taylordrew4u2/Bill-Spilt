"use client";

import * as React from "react";
import { X, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Ad, AdPlacement } from "@/lib/types";

/**
 * A tasteful, clearly-labeled sponsored slot. Fetches one weighted ad for the
 * placement (which records an impression server-side), and routes clicks
 * through the tracking redirect. Dismissible for the session; renders nothing
 * when there's no ad to show, so it never leaves an empty gap.
 */
export function AdSlot({ placement }: { placement: AdPlacement }) {
  const [ad, setAd] = React.useState<Ad | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetch(`/api/ads?placement=${placement}`)
      .then((r) => (r.ok ? r.json() : { ad: null }))
      .then((d) => {
        if (active) setAd(d.ad ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [placement]);

  if (!ad || dismissed) return null;

  return (
    <Card className="overflow-hidden">
      {/* Label row: always visible above the creative, never overlaid on it. */}
      <div className="flex items-center justify-between pl-4 pr-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sponsored
        </span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Hide ad"
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <a
        href={`/api/ads/${ad.id}/click`}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block px-4 pb-4 transition-colors active:bg-accent/60"
      >
        {ad.imageUrl && (
          <div className="mb-3 aspect-[3/1] w-full overflow-hidden rounded-xl bg-muted">
            {/* Advertiser-supplied external image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <p className="line-clamp-2 text-base font-semibold leading-snug">
          {ad.title}
        </p>
        {ad.body && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {ad.body}
          </p>
        )}
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">
          {ad.cta || "Learn more"}
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </span>
      </a>
    </Card>
  );
}
