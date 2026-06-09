import type { PaymentMethod } from "@/lib/types";

/**
 * Build a tappable payment URL from a payment method (Venmo or Cash App).
 * On mobile these open the app; on desktop, the web equivalent. The amount and
 * note are prefilled where supported (e.g. from the Settle screen).
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
    default:
      return null;
  }
}
