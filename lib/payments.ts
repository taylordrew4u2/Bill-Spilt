import type { PaymentMethod } from "@/lib/types";

/**
 * Build a tappable payment URL from a payment method where the provider exposes
 * one (Venmo, Cash App, PayPal, Revolut). On mobile these open the app; on
 * desktop, the web equivalent, with the amount prefilled where supported.
 * Providers without a universal link (Zelle, Apple Cash) return null — the UI
 * then shows the handle as copyable text instead.
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
      // Email-style PayPal handles have no universal deep link — show as text.
      if (v.includes("@")) return null;
      const user = v.replace(/^https?:\/\/(www\.)?paypal\.me\//i, "").replace(/^@/, "");
      if (!user) return null;
      return amt ? `https://paypal.me/${user}/${amt}` : `https://paypal.me/${user}`;
    }
    case "revolut": {
      const tag = v.replace(/^https?:\/\/(www\.)?revolut\.me\//i, "").replace(/^@/, "");
      if (!tag) return null;
      return amt
        ? `https://revolut.me/${tag}?amount=${amt}`
        : `https://revolut.me/${tag}`;
    }
    // Zelle and Apple Cash have no universal payment URL.
    case "zelle":
    case "applecash":
    default:
      return null;
  }
}
