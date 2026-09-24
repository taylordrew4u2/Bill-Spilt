"use client";

import * as React from "react";
import { Copy, Check, ExternalLink, Wallet } from "lucide-react";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/types";
import { paymentLink } from "@/lib/payments";
import { cn } from "@/lib/utils";

/**
 * A handle with line-break chances after "@" and before each ".", so an email
 * that has to wrap splits at "name@" / "example.com" rather than mid-word.
 */
function breakable(value: string): React.ReactNode {
  const parts = value.split(/([@.])/);
  if (parts.length === 1) return value;
  return parts.map((part, i) => (
    <React.Fragment key={i}>
      {part === "." && i > 0 && <wbr />}
      {part}
      {part === "@" && i < parts.length - 1 && <wbr />}
    </React.Fragment>
  ));
}

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
    <ul className={cn("divide-y divide-border/70", className)}>
      {methods.map((pm, i) => {
        const def = PAYMENT_METHODS.find((p) => p.value === pm.type);
        const label = def?.label ?? pm.type;
        const href = paymentLink(pm, linkContext);
        const isCopied = copied === i;

        // Provider name on top, the handle underneath at body size so it's
        // easy to read back or check before paying.
        const body = (
          <>
            {/* The same wallet on every row, so it gives way on narrow
                screens and leaves the width to the handle. */}
            <span
              className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary min-[360px]:flex"
              aria-hidden
            >
              <Wallet className="h-5 w-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {label}
                {href && <ExternalLink className="h-4 w-4 flex-shrink-0" aria-hidden />}
              </span>
              {/* Long handles (emails, phone numbers) wrap rather than being
                  cut off, so you can read the whole thing before paying. */}
              <span
                className={cn(
                  "line-clamp-3 break-words text-base font-medium leading-snug",
                  href && "text-primary",
                )}
              >
                {breakable(pm.value)}
              </span>
            </span>
          </>
        );

        return (
          <li key={i} className="flex min-h-14 items-center gap-1 py-1">
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Pay with ${label}: ${pm.value} (opens ${label})`}
                className="-ml-2 flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1 transition-colors active:bg-accent [@media(hover:hover)]:hover:bg-accent"
              >
                {body}
              </a>
            ) : (
              <div className="flex min-h-12 min-w-0 flex-1 items-center gap-3 py-1">
                {body}
              </div>
            )}
            <button
              type="button"
              onClick={() => copy(pm.value, i)}
              aria-label={isCopied ? `${label} copied` : `Copy ${label}`}
              className={cn(
                "-mr-1.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-colors active:bg-accent [@media(hover:hover)]:hover:bg-accent",
                isCopied
                  ? "text-positive"
                  : "text-muted-foreground [@media(hover:hover)]:hover:text-foreground",
              )}
            >
              {isCopied ? (
                <Check className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              ) : (
                <Copy className="h-5 w-5" aria-hidden />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
