"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Renders a person's "ways to pay" with a tap-to-copy button on each value.
 * Used on the Settle screen (who you owe) and in the member roster.
 */
export function PaymentMethodsList({
  methods,
  className,
}: {
  methods: PaymentMethod[];
  className?: string;
}) {
  const [copied, setCopied] = React.useState<number | null>(null);

  async function copy(value: string, i: number) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (methods.length === 0) return null;

  return (
    <ul className={cn("space-y-1", className)}>
      {methods.map((pm, i) => {
        const def = PAYMENT_METHODS.find((p) => p.value === pm.type);
        return (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span aria-hidden>{def?.emoji ?? "🔗"}</span>
            <span className="text-muted-foreground">{def?.label ?? pm.type}:</span>
            <span className="min-w-0 flex-1 truncate font-medium">{pm.value}</span>
            <button
              type="button"
              onClick={() => copy(pm.value, i)}
              aria-label={`Copy ${def?.label ?? pm.type}`}
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {copied === i ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
