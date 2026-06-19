"use client";

import { Card } from "@/components/ui/card";
import { AdSenseUnit, ADSENSE_CLIENT, ADSENSE_SLOT } from "@/components/adsense";
import { AdSlot } from "@/components/ad-slot";
import type { AdPlacement } from "@/lib/types";

/**
 * Unified ad placement:
 *  - AdSense + a slot id  → a network display unit here.
 *  - AdSense, no slot     → nothing here; page-level Auto ads (enabled in the
 *                           AdSense dashboard) place ads automatically via the
 *                           script in <head>.
 *  - No AdSense           → a self-served house ad for this placement.
 * This lets you run passive network ads OR sell placements directly.
 */
export function AdArea({
  placement,
  slot,
}: {
  placement: AdPlacement;
  slot?: string;
}) {
  if (ADSENSE_CLIENT) {
    const resolvedSlot = slot || ADSENSE_SLOT;
    if (!resolvedSlot) return null; // Auto ads handle placement page-wide.
    return (
      <Card className="overflow-hidden border-dashed p-2">
        <p className="px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Advertisement
        </p>
        <div className="min-h-[90px]">
          <AdSenseUnit slot={resolvedSlot} />
        </div>
      </Card>
    );
  }
  return <AdSlot placement={placement} />;
}
