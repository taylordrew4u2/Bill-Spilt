"use client";

import * as React from "react";
import { Copy, Check, ExternalLink, Wallet } from "lucide-react";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/types";
import { paymentLink } from "@/lib/payments";
import { cn } from "@/lib/utils";

/**
 * Renders a person's "ways to pay". Each value is a tappable deep link when
 * one can be derived (Venmo / Cash App / PayPal / URLs) — opening the app with
 * the amount prefilled where supported — and always has a tap-to-copy button.
 * Used on the Settle screen (who you owe) and in the member roster.
 */
export function PaymentMethodsList({
  methods,
  linkContext,
  className,
}: {
  methods: PaymentMethod[];
  /** Optional amount/note to prefill into payment links (e.g. on Settle). */
  linkContext?: { amount?: number; note?: string };
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
        const href = paymentLink(pm, linkContext);
        return (
          <li key={i} className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-muted-foreground">{def?.label ?? pm.type}:</span>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-1 font-medium text-primary hover:underline"
              >
                <span className="truncate">{pm.value}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-70" />
              </a>
            ) : (
              <span className="min-w-0 flex-1 truncate font-medium">{pm.value}</span>
            )}
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
