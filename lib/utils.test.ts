import { describe, it, expect } from "vitest";
import {
  roundMoney,
  formatCurrency,
  initials,
  generateInviteCode,
  colorForId,
} from "@/lib/utils";

describe("roundMoney", () => {
  it("rounds to two decimals and kills float drift", () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(13.333333)).toBe(13.33);
    expect(roundMoney(13.335)).toBe(13.34);
  });
});

describe("formatCurrency", () => {
  it("formats USD", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("initials", () => {
  it("takes up to two initials, uppercased", () => {
    expect(initials("alice")).toBe("A");
    expect(initials("bob smith")).toBe("BS");
    expect(initials("mary jane watson")).toBe("MJ");
  });
});

describe("generateInviteCode", () => {
  it("produces an N-char code with no ambiguous characters", () => {
    const code = generateInviteCode(6);
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z2-9]+$/); // no 0/O/1/I
  });
});

describe("colorForId", () => {
  it("is deterministic for the same id", () => {
    expect(colorForId("abc")).toBe(colorForId("abc"));
    expect(colorForId("abc")).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
