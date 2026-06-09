import type { PaymentMethod } from "@/lib/types";

/**
 * Build a tappable payment URL from a payment method, when one can be derived.
 * On mobile these open the corresponding app; on desktop they open the web
 * equivalent. Returns null when there's no reliable deep link (e.g. Zelle, raw
 * bank details, or a PayPal email), in which case the UI falls back to
 * copy-only.
 *
 * When `amount`/`note` are provided (e.g. from the Settle screen), they're
 * prefilled into the payment request where the provider supports it.
 */
export function paymentLink(
  pm: PaymentMethod,
  opts?: { amount?: number; note?: string },
): string | null {
  const v = pm.value.trim();
  if (!v) return null;
  const amt = opts?.amount && opts.amount > 0 ? opts.amount.toFixed(2) : undefined;

  switch (pm.type) {
    case "venmo": {
      const handle = v.replace(/^@/, "");
      const params = new URLSearchParams({ txn: "pay", recipients: handle });
      if (amt) params.set("amount", amt);
      if (opts?.note) params.set("note", opts.note);
      return `https://venmo.com/?${params.toString()}`;
    }
    case "cashapp": {
      const tag = v.replace(/^\$/, "");
      return amt ? `https://cash.app/$${tag}/${amt}` : `https://cash.app/$${tag}`;
    }
    case "paypal": {
      if (/^https?:\/\//i.test(v)) return v;
      if (/paypal\.me\//i.test(v)) return `https://${v.replace(/^\/+/, "")}`;
      // Bare handle → paypal.me/<handle>[/amount]
      if (/^[a-z0-9_-]+$/i.test(v)) {
        return `https://paypal.me/${v}${amt ? `/${amt}` : ""}`;
      }
      return null; // e.g. an email — no reliable deep link
    }
    case "other":
      return /^https?:\/\//i.test(v) ? v : null;
    case "zelle":
    case "bank":
    default:
      return null;
  }
}
