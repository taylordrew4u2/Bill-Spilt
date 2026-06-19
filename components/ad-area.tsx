"use client";

import { Card } from "@/components/ui/card";
import { AdSenseUnit, ADSENSE_CLIENT } from "@/components/adsense";
import { AdSlot } from "@/components/ad-slot";
import type { AdPlacement } from "@/lib/types";

/**
 * Unified ad placement. If Google AdSense is configured
 * (NEXT_PUBLIC_ADSENSE_CLIENT), it shows a network ad unit; otherwise it falls
 * back to a self-served house ad for the same placement. This lets you run
 * passive network ads OR sell placements directly, without page changes.
 */
export function AdArea({
  placement,
  slot,
}: {
  placement: AdPlacement;
  slot?: string;
}) {
  if (ADSENSE_CLIENT) {
    return (
      <Card className="overflow-hidden border-dashed p-2">
        <p className="px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Advertisement
        </p>
        <div className="min-h-[90px]">
          <AdSenseUnit slot={slot} />
        </div>
      </Card>
    );
  }
  return <AdSlot placement={placement} />;
}
