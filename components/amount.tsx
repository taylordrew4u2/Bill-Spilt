"use client";

import { useMoney } from "@/components/app-data";
import { cn } from "@/lib/utils";

/**
 * A money figure that may be hidden from the viewer.
 *
 * The server sends `null` for amounts the viewer isn't allowed to see (see
 * lib/visibility.ts), so render a dash instead of a number rather than
 * pretending the amount is zero.
 */
export function Amount({
  value,
  className,
  hiddenClassName,
}: {
  value: number | null;
  className?: string;
  hiddenClassName?: string;
}) {
  const money = useMoney();
  if (value === null) {
    return (
      <span
        className={cn("text-muted-foreground", hiddenClassName ?? className)}
        title="Amounts are only shown to the household admin and the people they're between"
      >
        —
      </span>
    );
  }
  return <span className={className}>{money(value)}</span>;
}
