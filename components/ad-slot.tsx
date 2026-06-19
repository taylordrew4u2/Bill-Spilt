"use client";

import * as React from "react";
import { X, ExternalLink } from "lucide-react";
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
    <Card className="relative overflow-hidden border-dashed">
      <span className="absolute left-2 top-2 z-10 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Sponsored
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Hide ad"
        className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <a
        href={`/api/ads/${ad.id}/click`}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block"
      >
        {ad.imageUrl && (
          <div className="h-32 w-full bg-muted">
            {/* Advertiser-supplied external image — eslint-disable-next-line @next/next/no-img-element */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ad.imageUrl} alt="" className="h-32 w-full object-cover" />
          </div>
        )}
        <div className="flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{ad.title}</p>
            {ad.body && (
              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                {ad.body}
              </p>
            )}
          </div>
          <span className="flex flex-shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            {ad.cta || "Learn more"}
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </div>
      </a>
    </Card>
  );
}
