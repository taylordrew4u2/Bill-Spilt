import { describe, it, expect } from "vitest";
import { paymentLink } from "@/lib/payments";

describe("paymentLink", () => {
  it("builds a Venmo pay link, stripping @ and prefilling amount + note", () => {
    const url = paymentLink(
      { type: "venmo", value: "@alice" },
      { amount: 12.5, note: "BILL SPILT" },
    );
    expect(url).toContain("https://venmo.com/?");
    expect(url).toContain("recipients=alice");
    expect(url).toContain("amount=12.50");
    expect(url).toContain("txn=pay");
  });

  it("builds a Cash App link with amount, stripping $", () => {
    expect(paymentLink({ type: "cashapp", value: "$bob" }, { amount: 8 })).toBe(
      "https://cash.app/$bob/8.00",
    );
  });

  it("builds a Cash App profile link without an amount", () => {
    expect(paymentLink({ type: "cashapp", value: "bob" })).toBe(
      "https://cash.app/$bob",
    );
  });

  it("ignores a zero/empty amount", () => {
    const url = paymentLink({ type: "venmo", value: "alice" }, { amount: 0 });
    expect(url).not.toContain("amount=");
  });

  it("returns null for an empty value", () => {
    expect(paymentLink({ type: "venmo", value: "  " })).toBeNull();
  });
});
